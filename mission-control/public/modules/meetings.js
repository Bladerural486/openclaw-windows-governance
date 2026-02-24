export async function render(root, ctx) {
  let meetings;
  try {
    meetings = await ctx.api.get('meetings');
  } catch (_e) {
    meetings = ctx.api.local('meetings') || [];
  }

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold">Meetings</h2>
      <p class="text-sm text-slate-400 mb-3">Track sessions, duration, and action-item completion.</p>
      <form id="meetingForm" class="grid md:grid-cols-3 gap-2 mb-4">
        <input id="meetingTitle" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Meeting title" required />
        <input id="meetingDuration" type="number" min="5" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Duration (minutes)" value="25" />
        <button class="rounded bg-violet-500/20 border border-violet-400/40 px-3 py-2 text-sm text-violet-200">+ Add Meeting</button>
      </form>
      <div class="space-y-3 mb-4">
        ${meetings.map((meeting) => `
          <article class="rounded border border-slate-700 bg-slate-900/70 p-3" data-meeting="${meeting.id}">
            <div class="flex justify-between items-center">
              <p class="font-medium">${meeting.title}</p>
              <p class="text-sm text-slate-400">${meeting.duration} min</p>
            </div>
            <div class="mt-2 space-y-1">
              ${meeting.actionItems.map((item, idx) => `
                <label class="block text-sm"><input type="checkbox" data-meeting-id="${meeting.id}" data-index="${idx}" ${item.done ? 'checked' : ''}/> ${item.task}</label>
              `).join('')}
            </div>
          </article>
        `).join('')}
      </div>
    </section>
  `;

  root.querySelectorAll('input[type="checkbox"]').forEach((box) => {
    box.addEventListener('change', async () => {
      const meeting = meetings.find((m) => m.id === box.dataset.meetingId);
      if (!meeting) return;
      meeting.actionItems[Number(box.dataset.index)].done = box.checked;
      await ctx.api.put('meetings', meetings);
    });
  });

  root.querySelector('#meetingForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = ctx.sanitizeText(root.querySelector('#meetingTitle').value);
    const duration = Math.max(5, Number(root.querySelector('#meetingDuration').value || 25));
    if (!title) return;

    meetings.unshift({
      id: `meeting-${Date.now()}`,
      title,
      duration,
      actionItems: [{ task: 'Define next action', done: false }]
    });
    await ctx.api.put('meetings', meetings);
    ctx.banner.show('Meeting added.');
    render(root, ctx);
  });
}
