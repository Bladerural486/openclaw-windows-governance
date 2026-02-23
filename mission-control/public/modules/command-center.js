export async function render(root, ctx) {
  let agents = [];
  try {
    agents = await ctx.api.get('agents');
  } catch (_e) {
    agents = ctx.api.local('agents') || [];
  }

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold mb-2">Command Center</h2>
      <p class="text-sm text-slate-400 mb-4">Manage active agents, models, and providers.</p>
      <div class="grid md:grid-cols-2 gap-4">
        ${agents.map((agent) => `
          <article class="rounded-xl border border-slate-700 p-4 bg-slate-900/70">
            <div class="flex justify-between items-center mb-3">
              <div>
                <p class="font-semibold">${agent.name}</p>
                <p class="text-xs text-slate-400">${agent.role}</p>
              </div>
              <span class="text-xs px-2 py-1 rounded-full ${agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${agent.status}</span>
            </div>
            <label class="text-xs text-slate-400">Provider</label>
            <input data-field="provider" data-id="${agent.id}" class="w-full mt-1 mb-2 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm" value="${agent.provider}" />
            <label class="text-xs text-slate-400">Model</label>
            <input data-field="model" data-id="${agent.id}" class="w-full mt-1 mb-3 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm" value="${agent.model}" />
            <p class="text-xs text-slate-400">Capabilities: ${agent.capabilities.join(', ')}</p>
          </article>
        `).join('')}
      </div>
      <button id="saveAgents" class="mt-4 rounded bg-cyan-500/20 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200">Save Agent Configuration</button>
    </section>
  `;

  root.querySelector('#saveAgents').addEventListener('click', async () => {
    root.querySelectorAll('input[data-id]').forEach((input) => {
      const agent = agents.find((item) => item.id === input.dataset.id);
      if (!agent) return;
      agent[input.dataset.field] = input.value;
    });

    await ctx.api.put('agents', agents);
    ctx.banner.show('Agent configs synchronized. Team is battle ready.');
  });
}
