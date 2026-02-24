const express = require('express');
const { read, write, defaults } = require('../storage/storage');
const connectors = require('../adapters/connectors');

const router = express.Router();

const map = {
  agents: 'agents',
  projects: 'projects',
  revenue: 'revenue',
  timeline: 'timeline',
  intel: 'intel',
  meetings: 'meetings',
  youtube: 'youtube',
  crm: 'crm'
};

function validate(resource, payload) {
  if (payload === null || payload === undefined) return 'Payload is required';

  const expectsObject = ['projects', 'revenue', 'youtube'];
  const expectsArray = ['agents', 'timeline', 'intel', 'meetings', 'crm'];

  if (expectsObject.includes(resource) && (typeof payload !== 'object' || Array.isArray(payload))) {
    return `${resource} must be an object`;
  }

  if (expectsArray.includes(resource) && !Array.isArray(payload)) {
    return `${resource} must be an array`;
  }

  return null;
}

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mission-control', timestamp: new Date().toISOString() });
});

router.get('/resources', (_req, res) => {
  res.json({ resources: Object.keys(map) });
});

router.get('/bootstrap', async (_req, res) => {
  const payload = {};
  for (const resource of Object.keys(map)) {
    try {
      payload[resource] = await read(resource);
    } catch {
      payload[resource] = defaults[resource];
    }
  }
  res.json(payload);
});

router.get('/integrations/status', async (_req, res) => {
  const [meetings, youtube] = await Promise.all([
    connectors.meetingApi.sync(),
    connectors.youtubeApi.fetchChannelStats()
  ]);

  res.json({
    meetings,
    youtube,
    messaging: await connectors.messagingApi.dispatchAlert('Mission Control heartbeat ping'),
    automation: await connectors.automationTools.triggerWorkflow('daily-ops-review')
  });
});

router.get('/:resource', async (req, res) => {
  const file = map[req.params.resource];
  if (!file) {
    return res.status(404).json({ error: 'Unknown resource' });
  }

  try {
    const data = await read(file);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:resource', async (req, res) => {
  const file = map[req.params.resource];
  if (!file) {
    return res.status(404).json({ error: 'Unknown resource' });
  }

  const validationError = validate(req.params.resource, req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  try {
    const updated = await write(file, req.body);
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
