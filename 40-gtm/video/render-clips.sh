#!/usr/bin/env bash
#
# render-clips.sh — render every trade clip to out/.
#
#   ./render-clips.sh                 render all compositions
#   ./render-clips.sh Trade-02        render one
#
# Zero marginal cost: this runs locally, no credits, no API. Rendering 50 clips
# costs the same as rendering one — time on your own machine.
#
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p out

if [ $# -gt 0 ]; then
  IDS="$*"
else
  IDS=$(npx remotion compositions 2>/dev/null | awk '/^Trade-/{print $1}')
fi

[ -z "$IDS" ] && { echo "no compositions found"; exit 1; }

n=0
for id in $IDS; do
  printf '  rendering %-12s ' "$id"
  if npx remotion render "$id" "out/${id}.mp4" --log=error >/dev/null 2>&1; then
    echo "→ out/${id}.mp4 ($(du -h "out/${id}.mp4" | cut -f1))"
    n=$((n+1))
  else
    echo "FAILED"
  fi
done
echo
echo "$n clip(s) in $(pwd)/out"
echo "Sample data renders with a SAMPLE DATA watermark. Do not post those."
