const columns = ['ideas', 'active', 'waiting', 'complete'];

function card(task) {
  return `<article class="card-task rounded border border-slate-700 bg-slate-900 px-3 py-2" draggable="true" data-id="${task.id}">
    <p class="font-medium">${task.title}</p>
    <p class="text-xs text-slate-400 mt-1">Owner: ${task.owner} · Priority: ${task.priority}</p>
  </article>`;
}

export async function render(root, ctx) {
  let board;
  try {
    board = await ctx.api.get('projects');
  } catch (_e) {
    board = ctx.api.local('projects') || { ideas: [], active: [], waiting: [], complete: [] };
  }

  root.innerHTML = `
    <section class="module-card">
      <div class="flex flex-col gap-3 mb-3">
        <div>
          <h2 class="text-xl font-semibold">Projects Kanban</h2>
          <p class="text-sm text-slate-400">Drag and drop tasks across execution lanes.</p>
        </div>
        <form id="taskForm" class="grid md:grid-cols-4 gap-2">
          <input id="taskTitle" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Task title" required />
          <input id="taskOwner" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Owner" value="Atlas" />
          <select id="taskPriority" class="rounded border border-slate-700 bg-slate-800 px-3 py-2">
            <option>low</option><option selected>medium</option><option>high</option>
          </select>
          <button class="rounded bg-emerald-500/20 border border-emerald-400/40 px-3 py-2 text-sm text-emerald-200">+ Add Task</button>
        </form>
      </div>
      <div class="grid lg:grid-cols-4 gap-3">
        ${columns.map((col) => `
          <section class="rounded-xl border border-slate-700 bg-slate-900/50 p-3">
            <h3 class="font-semibold capitalize mb-3">${col}</h3>
            <div class="drop-zone space-y-2" data-column="${col}">${(board[col] || []).map(card).join('')}</div>
          </section>
        `).join('')}
      </div>
    </section>
  `;

  let draggingId = null;
  root.querySelectorAll('.card-task').forEach((item) => {
    item.addEventListener('dragstart', () => {
      draggingId = item.dataset.id;
    });
  });

  root.querySelectorAll('.drop-zone').forEach((zone) => {
    zone.addEventListener('dragover', (event) => event.preventDefault());
    zone.addEventListener('drop', async () => {
      if (!draggingId) return;
      let pulled = null;
      columns.forEach((col) => {
        board[col] = board[col].filter((task) => {
          if (task.id === draggingId) {
            pulled = task;
            return false;
          }
          return true;
        });
      });
      if (pulled) {
        board[zone.dataset.column].push(pulled);
        await ctx.api.put('projects', board);
        ctx.refreshStats();
        if (board.complete.length >= 5) {
          ctx.banner.show('Achievement: Execution machine unlocked (5 completed tasks)!');
        }
        render(root, ctx);
      }
    });
  });

  root.querySelector('#taskForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = ctx.sanitizeText(root.querySelector('#taskTitle').value);
    const owner = ctx.sanitizeText(root.querySelector('#taskOwner').value) || 'Atlas';
    const priority = root.querySelector('#taskPriority').value;
    if (!title) return;
    board.ideas.push({ id: `task-${Date.now()}`, title, owner, priority });
    await ctx.api.put('projects', board);
    ctx.banner.show('Task added to Ideas.');
    render(root, ctx);
  });
}
