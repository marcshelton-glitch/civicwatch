#!/usr/bin/env python3
"""Add task #52 (video ad concepts) to gantt-state.json, same route as apply-gtm-tasks.py.

Idempotent: re-running changes nothing. Writes a timestamped .bak first.
After running: run the Project Schedule shortcut to regenerate gantt.html and AGENT-BRIEF.md.
"""
import json, shutil, sys
from datetime import datetime
from pathlib import Path

STATE = Path(__file__).parent / "gantt-state.json"
PHASE = "GTM — First Customers"

NEW = {
    "id": 52,
    "name": "Produce the video ad concepts for organic launch week (Concept 2 first, labeled presenter cut second)",
    "phase": PHASE,
    "planned":   {"start": "2026-10-09", "end": "2026-10-12"},
    "scheduled": {"start": "2026-10-09", "end": "2026-10-12"},
    "status": "pending", "actualCompletionDate": None,
    "varianceDays": 0, "needsAttention": False, "attentionReason": None,
    "dependsOn": ["Lock the CivicWatch AI presenter reference image"],
    "note": (
        "Added 2026-10-08. See '## Video ad concepts' in 40-gtm/media-plan.md. "
        "$0, organic channels only; anything paid needs the exact cost told to Marc first. "
        "Build Concept 2 (Capitol motion graphics, Remotion, real screenshots) first for the Product Hunt "
        "gallery, Show HN and press kit. Then Concept 1 (presenter A3) for launch week Oct 13-16. "
        "NON-NEGOTIABLE on publish: persistent 'AI presenter - data from public STOCK Act filings' lower-third, "
        "platform AI-content flag, narrator only, real screenshots only, conflict score described as an "
        "indicator not proof, verify the 13,100+ figure on the live site. Does not touch the Meta pilot. "
        "Dates are a proposal; move them if the Show HN / Product Hunt prep needs the days."
    ),
    "durationWorkdays": 2,
}

def main():
    state = json.loads(STATE.read_text())
    if any(t["id"] == NEW["id"] for t in state["tasks"]):
        print("Nothing to do — already applied.")
        return 0
    shutil.copy(STATE, STATE.with_name(STATE.name + ".bak." + datetime.now().strftime("%Y%m%d-%H%M%S")))
    state["tasks"].append(NEW)
    tasks = state["tasks"]
    done = sum(1 for t in tasks if t.get("status") == "done")
    state["totals"].update({"total": len(tasks), "done": done,
                            "remaining": len(tasks) - done,
                            "pctDone": round(done * 100 / len(tasks))})
    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    print(f"Added task 52. Totals: {state['totals']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
