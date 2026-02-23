# Mission Control (Local-First AI Operations Dashboard)

Mission Control is a modular local dashboard for managing projects, agents, growth metrics, meetings, and CRM workflows from one command center UI.

## One-click setup (recommended)

### Windows
- Double-click `Launch-Mission-Control.bat`

### macOS
- Double-click `Launch-Mission-Control.command`

### Linux
- Double-click `launch-mission-control.sh` (or run it from terminal)

What happens automatically:
1. Checks whether dependencies are installed
2. Runs `npm install` automatically on first launch
3. Starts local server
4. Opens browser to `http://localhost:4173`
5. Reuses an already-running local Mission Control server if one is detected

## Terminal setup (manual fallback)

```bash
cd mission-control
npm install
npm run one-click
```

Or standard server mode:

```bash
cd mission-control
npm install
npm start
```

If the server is unavailable, the UI enters offline mode and uses local cached data automatically.

## Why this is "Apple-simple"

- One launcher file per OS
- First run auto-installs dependencies
- Browser auto-opens to the dashboard URL
- No external database required (JSON local files)
- One consistent API (`/api/:resource`) for every module
- Smart fallback to `localStorage` if server temporarily fails
- Startup bootstrap endpoint loads all modules at once (`GET /api/bootstrap`)
- Input guardrails (basic validation + sanitization) to prevent invalid saves
- Atomic writes + `.bak` backup files to reduce data corruption risk

## Architecture

- **Frontend**: `public/index.html`, `public/styles.css`, and modular feature files in `public/modules/`.
- **Backend**: `server/server.js` + `server/routes/resources.js`.
- **Storage**: JSON files in `server/storage/`.
- **Adapters (mock connectors)**: `server/adapters/connectors.js` for future integrations.

## REST endpoints

- `GET /api/health`
- `GET /api/resources`
- `GET /api/bootstrap` (load all module data in one request)
- `GET /api/:resource` (agents, projects, revenue, timeline, intel, meetings, youtube, crm)
- `PUT /api/:resource` (replace persisted payload)
- `GET /api/integrations/status` (mock connector heartbeat)

## Extension points

### 1) Add new module tab

1. Create `public/modules/<module>.js` exporting `render(root, ctx)`.
2. Register it in `public/app.js` `tabs[]` list.
3. Add new JSON file in `server/storage/` if persistence is required.

### 2) Connect real APIs

Replace mocks in `server/adapters/connectors.js` with:
- OAuth/API key handling
- Retry logic
- schema validation

### 3) Add automation workflows

Use connector method `automationTools.triggerWorkflow` as entry point for:
- scheduled jobs
- webhook dispatch
- external orchestrators
