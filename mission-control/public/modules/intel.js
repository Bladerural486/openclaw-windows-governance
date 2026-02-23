export async function render(root, ctx) {
  let intel;
  try {
    intel = await ctx.api.get('intel');
  } catch (_e) {
    intel = ctx.api.local('intel') || [];
  }

  root.innerHTML = `
    <section class="module-card">
      <h2 class="text-xl font-semibold">Intel Report</h2>
      <p class="text-sm text-slate-400 mb-3">Daily briefing module (API-ready with local fallback).</p>
      <div class="space-y-2 mb-4">
        ${intel.map((item) => `
          <article class="rounded border border-slate-700 bg-slate-900/70 p-3">
            <p class="font-medium">${item.headline} · ${item.date}</p>
            <p class="text-sm text-slate-300">${item.summary}</p>
          </article>
        `).join('')}
      </div>
      <textarea id="intelSummary" rows="3" class="w-full rounded border border-slate-700 bg-slate-800 p-2" placeholder="Paste a new briefing..."></textarea>
      <button id="saveIntel" class="mt-2 rounded bg-cyan-500/20 border border-cyan-400/40 px-3 py-2 text-sm text-cyan-200">Save Briefing</button>
    </section>
  `;

  root.querySelector('#saveIntel').addEventListener('click', async () => {
    const summary = root.querySelector('#intelSummary').value.trim();
    if (!summary) return;
    intel.unshift({ id: `intel-${Date.now()}`, date: new Date().toISOString().slice(0, 10), headline: 'Manual Briefing', summary });
    intel = intel.slice(0, 8);
    await ctx.api.put('intel', intel);
    ctx.banner.show('Intel report updated and archived locally.');
    render(root, ctx);
  });
}
