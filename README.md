## Team Assistant (Chrome Extension + Backend)

This repo contains:
- `Chrome_Extension-Plugin/` – built Chrome extension (load unpacked)
- `Chrome_Extension-orchestrator/` – FastAPI backend (`/api/chat`, `/api/employees/search`)
- `notification_service/` – standalone FastAPI notification decision service (`/api/notifications/ui-leave`)

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

## Load the Chrome extension

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `/Users/bhsingh/Documents/Personal/Chrome_Extension/Chrome_Extension-Plugin`

The extension calls:
- `http://localhost:8000` for orchestrator APIs
- `http://localhost:8001` for notification decision APIs

## Open the UI in browser (no extension)

After `docker compose up`, open `http://localhost:8080`.
