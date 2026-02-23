export async function render(root, ctx) {
  let yt;
  try {
    yt = await ctx.api.get('youtube');
  } catch (_e) {
    yt = ctx.api.local('youtube') || { subscribers: 0, goal: 1000, milestones: [] };
  }

  const progress = Math.min(100, Math.round((yt.subscribers / yt.goal) * 100));

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold">YouTube Growth Tracker</h2>
      <p class="text-sm text-slate-400 mb-3">Milestone animations trigger when growth unlocks are reached.</p>
      <p class="text-3xl font-bold text-rose-300 mb-2">${yt.subscribers.toLocaleString()} subscribers</p>
      <div class="h-4 rounded bg-slate-800 overflow-hidden mb-4">
        <div class="h-full bg-gradient-to-r from-rose-400 to-fuchsia-400" style="width:${progress}%"></div>
      </div>
      <div class="flex flex-wrap gap-2 mb-4">
        ${yt.milestones.map((m) => `<span class="text-xs px-2 py-1 rounded-full ${yt.subscribers >= m ? 'bg-rose-500/20 text-rose-200' : 'bg-slate-800 text-slate-300'}">${m}</span>`).join('')}
      </div>
      <div class="flex gap-2">
        <input id="subsDelta" type="number" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Add subscribers" />
        <button id="addSubs" class="rounded bg-rose-500/20 border border-rose-400/40 px-3 py-2 text-sm text-rose-200">Update</button>
      </div>
    </section>
  `;

  root.querySelector('#addSubs').addEventListener('click', async () => {
    const delta = Number(root.querySelector('#subsDelta').value || 0);
    if (!delta) return;
    const before = yt.subscribers;
    yt.subscribers += delta;
    await ctx.api.put('youtube', yt);
    ctx.refreshStats();

    const hitMilestone = yt.milestones.some((m) => before < m && yt.subscribers >= m);
    if (hitMilestone) {
      ctx.banner.show('🎉 YouTube milestone hit! Growth engine leveled up.');
      ctx.triggerBossBattle();
    }

    render(root, ctx);
  });
}
