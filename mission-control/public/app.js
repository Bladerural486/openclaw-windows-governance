const tabs = [
  { id: 'command', label: '🧠 Command Center', file: './modules/command-center.js' },
  { id: 'projects', label: '📌 Projects', file: './modules/projects.js' },
  { id: 'revenue', label: '💰 Revenue Tracker', file: './modules/revenue.js' },
  { id: 'timeline', label: '🗺️ Timeline / Goals', file: './modules/timeline.js' },
  { id: 'intel', label: '🛰️ Intel Report', file: './modules/intel.js' },
  { id: 'meetings', label: '📞 Meetings', file: './modules/meetings.js' },
  { id: 'youtube', label: '▶️ YouTube Growth', file: './modules/youtube.js' },
  { id: 'crm', label: '🤝 Mini CRM', file: './modules/crm.js' }
];

const cache = {};
const statusNode = document.querySelector('#serverStatus');

async function safeFetch(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    statusNode.textContent = '● System ready';
    statusNode.className = 'text-xs text-emerald-300';

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Only mark offline for network-level failures.
    if (error.name === 'AbortError' || /Failed to fetch|NetworkError|fetch/i.test(error.message)) {
      statusNode.textContent = '● Offline mode active';
      statusNode.className = 'text-xs text-amber-300';
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const api = {
  async get(resource) {
    const payload = await safeFetch(`/api/${resource}`);
    cache[resource] = payload;
    localStorage.setItem(`mc:${resource}`, JSON.stringify(payload));
    return payload;
  },
  async put(resource, payload) {
    const data = await safeFetch(`/api/${resource}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    cache[resource] = data;
    localStorage.setItem(`mc:${resource}`, JSON.stringify(data));
    return data;
  },
  local(resource) {
    if (cache[resource]) return cache[resource];
    const raw = localStorage.getItem(`mc:${resource}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    cache[resource] = parsed;
    return parsed;
  }
};

const banner = {
  show(text) {
    const wrap = document.querySelector('#achievementBanner');
    document.querySelector('#achievementText').textContent = text;
    wrap.classList.remove('hidden');
    setTimeout(() => wrap.classList.add('hidden'), 3500);
  }
};

const ctx = {
  api,
  banner,
  refreshStats,
  triggerBossBattle,
  sanitizeText(value) {
    return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 120);
  }
};

async function loadBaseline() {
  try {
    const payload = await safeFetch('/api/bootstrap');
    Object.entries(payload).forEach(([key, value]) => {
      cache[key] = value;
      localStorage.setItem(`mc:${key}`, JSON.stringify(value));
    });
  } catch {
    ['revenue', 'projects', 'crm', 'youtube'].forEach((name) => api.local(name));
  }

  refreshStats();
  maybeShowOnboarding();
}

function maybeShowOnboarding() {
  const node = document.querySelector('#onboardingPanel');
  const projects = api.local('projects') || { ideas: [], active: [], waiting: [], complete: [] };
  const revenue = api.local('revenue') || { current: 0 };
  const empty = (projects.ideas.length + projects.active.length + projects.waiting.length + projects.complete.length) === 0;
  if (empty || Number(revenue.current) === 0) {
    node.classList.remove('hidden');
  }
}

function refreshStats() {
  const revenue = api.local('revenue') || { current: 0 };
  const projects = api.local('projects') || { active: [] };
  const crm = api.local('crm') || [];
  const youtube = api.local('youtube') || { subscribers: 0 };

  document.querySelector('#statRevenue').textContent = `$${Number(revenue.current || 0).toLocaleString()}`;
  document.querySelector('#statProjects').textContent = `${projects.active?.length || 0}`;
  document.querySelector('#statContacts').textContent = `${crm.length}`;
  document.querySelector('#statSubs').textContent = `${Number(youtube.subscribers || 0).toLocaleString()}`;
}

function triggerBossBattle() {
  const node = document.querySelector('#moduleRoot');
  node.classList.add('boss-battle');
  setTimeout(() => node.classList.remove('boss-battle'), 2800);
}

async function mountModule(tab) {
  const moduleRoot = document.querySelector('#moduleRoot');
  moduleRoot.innerHTML = '<p class="text-slate-400">Loading module...</p>';

  try {
    const mod = await import(tab.file);
    await mod.render(moduleRoot, ctx);
  } catch (error) {
    moduleRoot.innerHTML = `<section class="module-card"><p class="text-rose-300">Could not load module: ${error.message}</p></section>`;
  }
}

function renderTabs() {
  const target = document.querySelector('#moduleTabs');
  target.innerHTML = tabs.map((tab, index) => `
    <button class="tab-btn ${index === 0 ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>
  `).join('');

  const byId = new Map(tabs.map((t) => [t.id, t]));
  target.addEventListener('click', async (event) => {
    const btn = event.target.closest('button[data-tab]');
    if (!btn) return;
    target.querySelectorAll('button').forEach((node) => node.classList.remove('active'));
    btn.classList.add('active');
    await mountModule(byId.get(btn.dataset.tab));
  });

  mountModule(tabs[0]);
}

function startClock() {
  const update = () => {
    document.querySelector('#clock').textContent = new Date().toLocaleTimeString();
  };
  update();
  setInterval(update, 1000);
}

startClock();
await loadBaseline();
renderTabs();
