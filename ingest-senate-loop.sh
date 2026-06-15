#!/bin/bash
WORKTREE="/Users/marcshelton/civicwatch/.claude/worktrees/hardcore-dijkstra-1b5fdd"
ENV_FILE="/Users/marcshelton/civicwatch/.env.local"
LOG="/Users/marcshelton/civicwatch/ingest-senate.log"

cd "$WORKTREE"
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== Senate PTR Trades Ingestion ==="

while true; do
  PROBE=$(node --env-file="$ENV_FILE" scripts/probe-senate-efts.mjs 2>&1)
  log "Probe: $PROBE"
  if [ "$PROBE" = "200" ]; then
    log "Search endpoint live — starting ingestion"
    break
  fi
  log "Not ready — retrying in 5 minutes..."
  sleep 300
done

output=$(node --env-file="$ENV_FILE" scripts/ingest-senate-trades.mjs --limit=100 2>&1)
echo "$output" | tee -a "$LOG"

if echo "$output" | grep -q "Done —"; then
  log "=== SENATE INGESTION COMPLETE ==="
else
  log "ERROR: ingestion did not complete cleanly"
  exit 1
fi
