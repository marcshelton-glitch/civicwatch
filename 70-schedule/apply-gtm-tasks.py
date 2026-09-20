#!/usr/bin/env python3
"""Apply the GTM tasks proposed in PROPOSED-gtm-tasks.md to gantt-state.json.

Idempotent: re-running changes nothing. Writes a .bak first.
After running: projects-dashboard/sync-charts.sh && build-today.sh
"""
import json, shutil, sys
from pathlib import Path

STATE = Path(__file__).parent / "gantt-state.json"
PHASE = "GTM — First Customers"

def task(tid, name, start, end, days, depends, note):
    return {
        "id": tid, "name": name, "phase": PHASE,
        "planned":   {"start": start, "end": end},
        "scheduled": {"start": start, "end": end},
        "status": "pending", "actualCompletionDate": None,
        "varianceDays": 0, "needsAttention": False, "attentionReason": None,
        "dependsOn": depends, "note": note, "durationWorkdays": days,
    }

NEW = [
    task(37, "Decide the GTM basics — objective, ICP, three platforms",
         "2026-09-04", "2026-09-04", 1, [],
         "Decision task, Marc only. Decided 2026-09-04 (asked directly, not "
         "assumed): (1) objective — first paying Pro subscribers; (2) ICP — "
         "civic watchdog / accountability voter (tracks a specific rep's "
         "trades for accountability, not personal investing — conflict-score "
         "is the paid proof point, not 'invest like Congress'); (3) platforms — "
         "X, YouTube, and Reddit, three rather than the doc's own 'pick two' "
         "advice, by explicit choice. Written into 40-gtm/media-plan.md and "
         "40-gtm/social-media-plan.md. Unblocked #38-#41 same day."),
    task(38, "Claim and brand the three social profiles chosen in #37",
         "2026-09-05", "2026-09-05", 1,
         ["Decide the GTM basics — objective, ICP, three platforms"],
         "Launch-checklist gate: 'Social profiles claimed and branded "
         "consistently'. X, YouTube, Reddit. Handles per 30-brand/brand.md. "
         "Free."),
    task(39, "Support channel live with a stated SLA, FAQ for the top 10 questions",
         "2026-09-06", "2026-09-07", 2,
         ["Decide the GTM basics — objective, ICP, three platforms"],
         "Launch-checklist gate: 'Support channel live with a stated response "
         "SLA' + 'FAQ / docs cover the top 10 expected questions'. You cannot "
         "take money without somewhere for a customer to complain. Free — a "
         "monitored address and a published SLA is enough at this stage."),
    task(40, "Write and publish the launch post — founder-led, primary platform",
         "2026-09-08", "2026-09-08", 1,
         ["Decide the GTM basics — objective, ICP, three platforms",
          "Rewrite /pro around what actually works"],
         "social-media-plan.md: 'Founder-led, human-first content beats polished "
         "corporate output.' One post, primary platform (X — real-time reach for "
         "the accountability angle), pointing at /pro. This is the first task in "
         "the whole schedule that asks a stranger to look."),
    task(41, "Submit to Product Hunt, Hacker News, niche directories",
         "2026-09-09", "2026-09-10", 2,
         ["Rewrite /pro around what actually works",
          "Write and publish the launch post — founder-led, primary platform"],
         "media-plan.md already names these three rows. Free, and the backlinks "
         "outlast the launch spike."),
]

# #32 already shipped 2026-09-01 — ahead of the schedule this script would
# otherwise impose. Nothing to reschedule.
RESCHEDULE = {}


def main():
    state = json.loads(STATE.read_text())
    existing = {t["id"] for t in state["tasks"]}
    added = [t for t in NEW if t["id"] not in existing]
    if added:
        shutil.copy(STATE, STATE.with_suffix(".json.bak"))

    state["tasks"].extend(added)

    moved = []
    for tid, (start, end) in RESCHEDULE.items():
        for t in state["tasks"]:
            if t["id"] == tid and t["scheduled"]["start"] != start:
                if not added:
                    shutil.copy(STATE, STATE.with_suffix(".json.bak"))
                t["scheduled"] = {"start": start, "end": end}
                moved.append(tid)

    if PHASE not in state["phases"]:
        # Sits after the P0 work, before long-tail hardening.
        i = state["phases"].index("P0 Product Claim") + 1
        state["phases"].insert(i, PHASE)

    tasks = state["tasks"]
    done = sum(1 for t in tasks if t.get("status") == "done")
    state["totals"].update({
        "total": len(tasks), "done": done, "remaining": len(tasks) - done,
        "pctDone": round(done * 100 / len(tasks)),
    })

    if not added and not moved:
        print("Nothing to do — already applied.")
        return 0

    STATE.write_text(json.dumps(state, indent=2, ensure_ascii=False) + "\n")
    print(f"Added {len(added)} task(s): {[t['id'] for t in added]}")
    print(f"Rescheduled: {moved or 'none'}")
    print(f"Totals now {state['totals']['total']} tasks. Backup: {STATE.name}.bak")
    print("\nNext:  ~/Projects/projects-dashboard/sync-charts.sh"
          "  &&  ~/Projects/projects-dashboard/build-today.sh")
    return 0


if __name__ == "__main__":
    sys.exit(main())
