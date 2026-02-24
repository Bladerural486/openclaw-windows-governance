export async function render(root, ctx) {
  let revenue;
  try {
    revenue = await ctx.api.get('revenue');
  } catch (_e) {
    revenue = ctx.api.local('revenue') || { goal: 1, current: 0, milestones: [] };
  }

  const progress = Math.min(100, Math.round((revenue.current / revenue.goal) * 100));

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold">Revenue Tracker</h2>
      <p class="text-sm text-slate-400 mb-3">Track progress, milestones, and boss-battle events.</p>

      <div class="mb-2 flex justify-between text-sm">
        <span>$${revenue.current.toLocaleString()} / $${revenue.goal.toLocaleString()}</span>
        <span>${progress}%</span>
      </div>
      <div class="h-4 rounded bg-slate-800 overflow-hidden mb-4">
        <div class="h-full bg-gradient-to-r from-emerald-400 to-cyan-400" style="width:${progress}%"></div>
      </div>

      <div class="grid md:grid-cols-3 gap-3 mb-4">
        ${revenue.milestones.map((m) => `
          <article class="rounded border border-slate-700 p-3 ${revenue.current >= m.value ? 'bg-emerald-500/10' : 'bg-slate-900/70'}">
            <p class="font-medium">${m.name}</p>
            <p class="text-sm text-slate-400">$${m.value.toLocaleString()}</p>
          </article>
        `).join('')}
      </div>

      <div class="flex gap-2 items-center">
        <input id="revInput" type="number" min="0" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Add revenue" />
        <button id="addRevenue" class="rounded bg-emerald-500/20 border border-emerald-400/40 px-3 py-2 text-sm text-emerald-200">Apply</button>
      </div>
    </section>
  `;

  root.querySelector('#addRevenue').addEventListener('click', async () => {
    const amount = Number(root.querySelector('#revInput').value || 0);
    if (!amount) return;
    revenue.current += amount;
    await ctx.api.put('revenue', revenue);
    ctx.refreshStats();

    if (revenue.current >= revenue.goal) {
      ctx.banner.show('🔥 Boss Battle Won: Revenue target achieved!');
      ctx.triggerBossBattle();
    }

    render(root, ctx);
  });
}
