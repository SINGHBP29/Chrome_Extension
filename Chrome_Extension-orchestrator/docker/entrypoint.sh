#!/usr/bin/env sh
set -eu

echo "[orchestrator] Seeding Postgres (employees table)…"
python -m orchestrator.ingestion.postgres_ingestion

CHROMA_PATH="/app/orchestrator/storage/chroma"
if [ ! -d "$CHROMA_PATH" ] || [ -z "$(ls -A "$CHROMA_PATH" 2>/dev/null)" ]; then
  echo "[orchestrator] Building Chroma index (meeting notes)…"
  python -m orchestrator.ingestion.chroma_ingestion
else
  echo "[orchestrator] Chroma index already present; skipping build."
fi

echo "[orchestrator] Starting API on :8000"
exec uvicorn orchestrator.api:app --host 0.0.0.0 --port 8000
