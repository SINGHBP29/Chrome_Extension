## Team Assistant (Chrome Extension + Backend)

This repo contains:
- `Chrome_Extension-UI_Part/` – source UI + extension assets (React/Vite + `public/manifest.json`, `public/background.js`)
- `Chrome_Extension-Plugin/` – **build output** (load unpacked in Chrome). Do not edit by hand; it gets overwritten on every UI build.
- `Chrome_Extension-orchestrator/` – FastAPI backend (`/api/chat`, `/api/employees/search`)
- `notification_service/` – FastAPI notification decision service (`/api/notifications/ui-leave`)

UI calls are centralized in `/Users/bhsingh/Documents/Personal/Chrome_Extension/Chrome_Extension-UI_Part/src/lib/orchestratorClient.ts` to avoid duplicating fetch logic in multiple components.

## Run everything with Docker (no local installs)

Prerequisite: Docker Desktop.

```bash
cd /Users/bhsingh/Documents/Personal/Chrome_Extension
cp .env.example .env
docker compose up --build
```

Services:
- Orchestrator API: `http://localhost:8000`
- Notification service: `http://localhost:8001`
- Web UI (same UI as extension): `http://localhost:8080`
- Postgres (optional host access): `localhost:${POSTGRES_HOST_PORT}` (default `5432`)

If port `5432` is already in use, set `POSTGRES_HOST_PORT=5433` in `.env` and re-run.

The UI container also reverse-proxies:
- `http://localhost:8080/api/*` → orchestrator
- `http://localhost:8080/api/notifications/*` → notification service

## Load the Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `/Users/bhsingh/Documents/Personal/Chrome_Extension/Chrome_Extension-Plugin`

The extension calls:
- `http://localhost:8000` for orchestrator APIs
- `http://localhost:8001` for notification decision APIs

Optional (Gmail/Calendar + meeting approvals):
- Set your Google OAuth client id in `Chrome_Extension-UI_Part/public/manifest.json` (`oauth2.client_id`), then run `npm -C Chrome_Extension-UI_Part run build` and reload the extension.

## Open the UI in browser (no extension)

After `docker compose up`, open `http://localhost:8080`.
