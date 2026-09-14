# Milestone Quality Gates: 50/50

Part of the [Quality Management Plan](plan_quality_management.md). Full gate: nothing exits on a red gate.

## Gate Checks (all listed checks must pass)

| Check | M1 | M2 | M3 | M4 |
| --- | --- | --- | --- | --- |
| vitest 100% green | ✓ (RNG) | ✓ (scoring) | ✓ (state) | ✓ (all) |
| tsc + ESLint + Prettier clean | ✓ | ✓ | ✓ | ✓ |
| Playtest checklist 5/5 | — | ✓ | ✓ | ✓ |
| 60fps, no jank (DevTools) | — | — | — | ✓ |
| Balance target (win rate + playtime) | — | — | ✓ | ✓ |

## Gate Rules

- Blockers must be fixed before exit; minors go to backlog ([playtest-protocol](plan_playtest-protocol.md))
- Gate result (pass/fail + notes) is recorded in the change log of the [Quality Management Plan](plan_quality_management.md)
- A failed gate means the milestone slips — scope does not grow (charter risk #1)
