#!/bin/bash
cd "$(dirname "$0")"
python3 /Users/marcshelton/civicwatch/_push.py
echo ""
echo "Done! Check output above for commit SHA."
read -p "Press Enter to close..."
