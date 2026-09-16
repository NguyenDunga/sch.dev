# Playtest Protocol: 50/50

Part of the [Quality Management Plan](plan_quality_management.md). Self-playtest (solo dev) with a fixed checklist.

## When

- **M2:** after the vertical slice (1-blind loop)
- **M3:** after the full 12-blind run
- **M4:** final full run before "done"

## Checklist (all 5 must pass)

| # | Item | Pass means |
| --- | --- | --- |
| 1 | Fun | Want to keep playing past the first blind |
| 2 | Clear | A stranger could understand scoring without explanation |
| 3 | Pacing | Full run feels 45–60 min (M3/M4) |
| 4 | No confusion | No "wait, why did that score X?" moments |
| 5 | Replayability | Would run it again with a different seed |

Any item fail → milestone gate fails; log notes + fix, then retest.

## Bug Triage

| Class | Definition | Handling |
| --- | --- | --- |
| Blocker | Crash, broken loop, wrong scoring, save corruption | Must be fixed before milestone exit |
| Minor | Cosmetic, small UX friction, edge-case oddity | To backlog; fix at M4 if time allows |

## Balance Verification (seeded A/B)

- **Target:** full-run win rate 30–50% AND average run 45–60 min
- **Method:** play N runs (N=5) with fixed seeds under the current balance table; record win/loss + run time; tune [balance-baseline](plan_balance-baseline.md) numbers; repeat
- Balance number changes are **not** scope changes (see [Scope Management Plan](plan_scope_management.md))
