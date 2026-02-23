const stages = ['Lead', 'Discovery', 'Proposal', 'Negotiation', 'Won'];

export async function render(root, ctx) {
  let contacts;
  try {
    contacts = await ctx.api.get('crm');
  } catch (_e) {
    contacts = ctx.api.local('crm') || [];
  }

  root.innerHTML = `
    <section class="module-card">
      <div class="flex justify-between items-center mb-3">
        <div>
          <h2 class="text-xl font-semibold">Mini CRM</h2>
          <p class="text-sm text-slate-400">Pipeline + notes with local persistence.</p>
        </div>
      </div>
      <form id="contactForm" class="grid md:grid-cols-4 gap-2 mb-4">
        <input id="contactName" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Contact name" required />
        <input id="contactCompany" class="rounded border border-slate-700 bg-slate-800 px-3 py-2" placeholder="Company" value="New Account" />
        <select id="contactStage" class="rounded border border-slate-700 bg-slate-800 px-3 py-2">${stages.map((s) => `<option>${s}</option>`).join('')}</select>
        <button class="rounded bg-indigo-500/20 border border-indigo-400/40 px-3 py-2 text-sm text-indigo-200">+ Add Contact</button>
      </form>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-slate-400 border-b border-slate-700">
              <th class="py-2">Name</th>
              <th class="py-2">Company</th>
              <th class="py-2">Stage</th>
              <th class="py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${contacts.map((c) => `
              <tr class="border-b border-slate-800">
                <td class="py-2">${c.name}</td>
                <td class="py-2">${c.company}</td>
                <td class="py-2">
                  <select data-id="${c.id}" class="stageSelect rounded border border-slate-700 bg-slate-800 px-2 py-1">
                    ${stages.map((s) => `<option ${c.stage === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td class="py-2 text-slate-300">${c.notes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  root.querySelectorAll('.stageSelect').forEach((select) => {
    select.addEventListener('change', async () => {
      const contact = contacts.find((entry) => entry.id === select.dataset.id);
      if (!contact) return;
      contact.stage = select.value;
      await ctx.api.put('crm', contacts);
      ctx.refreshStats();
      const wonCount = contacts.filter((entry) => entry.stage === 'Won').length;
      if (wonCount >= 2) {
        ctx.banner.show('🏆 Client conversion streak unlocked!');
      }
    });
  });

  root.querySelector('#contactForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = ctx.sanitizeText(root.querySelector('#contactName').value);
    const company = ctx.sanitizeText(root.querySelector('#contactCompany').value) || 'New Account';
    const stage = root.querySelector('#contactStage').value;
    if (!name) return;

    contacts.push({
      id: `contact-${Date.now()}`,
      name,
      company,
      stage,
      notes: 'Added from Mission Control.'
    });
    await ctx.api.put('crm', contacts);
    ctx.refreshStats();
    ctx.banner.show('Contact added to pipeline.');
    render(root, ctx);
  });
}
