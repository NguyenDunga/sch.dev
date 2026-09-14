# M14 — Test Suite Completion

**Depends:** M2–M11 · **Files:** `*.test.ts` across `src/core/`, `src/state/` · **Source:** [Charter](../init/init_project_charter.md) §2 obj 5 · Conventions: [overview](plan_wbs-overview.md).

*Goal: consolidate and confirm coverage before README/ship.*

## Checkpoints

- [ ] 14.1 Every engine module (M2–M10) has a `*.test.ts`.
- [ ] 14.2 Full `vitest` suite 100% passing.
- [ ] 14.3 Determinism regression: a fixed-seed full run gives an identical sequence of draws, tosses, and shop offers across two runs.
- [ ] 14.4 Boundary sweep: hand sizes 1, 2, 3, 5 tossed against all 6 tiers (M5 rules hold through the full pipeline).
- [ ] 14.5 Guard: grep confirms no `Math.random()` in `src/core/` or `src/state/`.

## Exit gate

`npm run test` 100% green; determinism regression + boundary sweep pass; no `Math.random` in engine. (Charter M4: full suite green.)
