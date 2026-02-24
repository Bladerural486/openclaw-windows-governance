/**
 * Placeholder adapters for future integrations.
 * Replace mock responses with real API calls later.
 */

const connectors = {
  meetingApi: {
    async sync() {
      return { ok: true, source: 'mock-meeting-api', syncedAt: new Date().toISOString() };
    }
  },
  youtubeApi: {
    async fetchChannelStats() {
      return { ok: true, source: 'mock-youtube-api', subscribers: null, note: 'Connect API key later.' };
    }
  },
  messagingApi: {
    async dispatchAlert(message) {
      return { ok: true, source: 'mock-messaging-api', delivered: false, preview: message };
    }
  },
  automationTools: {
    async triggerWorkflow(workflowName) {
      return { ok: true, source: 'mock-automation-tool', workflowName, state: 'queued' };
    }
  }
};

module.exports = connectors;
