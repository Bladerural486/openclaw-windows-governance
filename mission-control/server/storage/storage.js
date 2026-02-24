const fs = require('fs/promises');
const path = require('path');

const storageDir = path.join(__dirname);

const defaults = {
  agents: [],
  projects: { ideas: [], active: [], waiting: [], complete: [] },
  revenue: { goal: 1, current: 0, milestones: [] },
  timeline: [],
  intel: [],
  meetings: [],
  youtube: { subscribers: 0, goal: 1000, milestones: [] },
  crm: []
};

const fileFor = (name) => path.join(storageDir, `${name}.json`);

async function ensureFile(name) {
  const target = fileFor(name);
  try {
    await fs.access(target);
  } catch {
    await fs.writeFile(target, `${JSON.stringify(defaults[name] ?? null, null, 2)}\n`, 'utf8');
  }
}

async function read(name) {
  await ensureFile(name);
  const raw = await fs.readFile(fileFor(name), 'utf8');
  return JSON.parse(raw);
}

async function write(name, payload) {
  const target = fileFor(name);
  const temp = `${target}.tmp`;
  const backup = `${target}.bak`;
  const content = JSON.stringify(payload, null, 2);

  await fs.writeFile(temp, `${content}\n`, 'utf8');

  try {
    await fs.copyFile(target, backup);
  } catch {
    // Backup is best effort for first-write scenarios.
  }

  await fs.rename(temp, target);
  return payload;
}

module.exports = { read, write, defaults };
