#!/bin/bash
WORKTREE="/Users/marcshelton/civicwatch/.claude/worktrees/hardcore-dijkstra-1b5fdd"
ENV_FILE="/Users/marcshelton/civicwatch/.env.local"
LOG="/Users/marcshelton/civicwatch/ingest-loop.log"

cd "$WORKTREE"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

log "=== PHASE 3: NET WORTH (limit=100) ==="
run=0
while true; do
  run=$((run + 1))
  log "--- Networth run #$run ---"
  output=$(node --env-file="$ENV_FILE" scripts/ingest-disclosures.mjs --phase=networth --limit=100 2>&1)
  echo "$output" | tee -a "$LOG"

  if echo "$output" | grep -q "Processing 0 Annual"; then
    log "Phase 3 complete (0 remaining)."
    break
  fi

  if [ -z "$output" ]; then
    log "ERROR: no output from node. Aborting."
    exit 1
  fi
done

log ""
log "=== ALL INGESTION COMPLETE ==="
