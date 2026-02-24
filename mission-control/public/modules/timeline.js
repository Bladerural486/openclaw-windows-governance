export async function render(root, ctx) {
  let timeline;
  try {
    timeline = await ctx.api.get('timeline');
  } catch (_e) {
    timeline = ctx.api.local('timeline') || [];
  }

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold mb-3">Timeline / Goals</h2>
      <div class="space-y-3 border-l-2 border-cyan-500/50 pl-4">
        ${timeline.map((phase) => `
          <article class="rounded border border-slate-700 bg-slate-900/70 p-3">
            <div class="flex justify-between">
              <p class="font-semibold">${phase.title}</p>
              <span class="text-xs ${phase.status === 'in-progress' ? 'text-emerald-300' : 'text-slate-400'}">${phase.status}</span>
            </div>
            <p class="text-sm text-slate-400">${phase.date}</p>
            <p class="text-sm mt-1">${phase.target}</p>
          </article>
        `).join('')}
      </div>
    </section>
  `;
}
