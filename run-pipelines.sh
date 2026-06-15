#!/bin/bash
# civicwatch pipeline launcher — run from ~/civicwatch
# Starts both pipelines in background, tails logs live

cd ~/civicwatch

LOG_HOUSE=/tmp/cw-house-ocr.log
LOG_SENATE=/tmp/cw-senate-efd.log

echo "=== CivicWatch Pipeline Launcher ==="
echo "Starting House OCR pipeline..."
nohup node --env-file=.env.local scripts/ocr-pipeline.js \
  --year=2024 --input=data/house-filings-2024.json \
  > "$LOG_HOUSE" 2>&1 &
HOUSE_PID=$!
echo "  House OCR PID: $HOUSE_PID  →  $LOG_HOUSE"

echo "Starting Senate eFD scraper..."
nohup node --env-file=.env.local scripts/ingest-senate-networth.mjs \
  --year=2024 --limit=200 \
  > "$LOG_SENATE" 2>&1 &
SENATE_PID=$!
echo "  Senate EFD PID: $SENATE_PID  →  $LOG_SENATE"

echo ""
echo "Both running. Tailing logs (Ctrl-C to stop watching — processes keep running):"
echo "────────────────────────────────────────────────────────────────"
tail -f "$LOG_HOUSE" "$LOG_SENATE"
