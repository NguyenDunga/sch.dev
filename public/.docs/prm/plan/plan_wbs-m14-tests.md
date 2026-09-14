# M14 — Test Suite Completion

**Depends:** M2–M11 · **Files:** `*.test.ts` across `src/core/`, `src/state/` · **Source of truth:** [Charter](../init/init_project_charter.md) §2 obj 5; [Testing Strategy](plan_testing-strategy.md) · Conventions: [overview](plan_wbs-overview.md).

*Goal: consolidate and confirm coverage before README/ship.*

## Checkpoints

- [ ] 14.1 Every core module (rng, deck, scoring) and the run store has a `*.test.ts`.
- [ ] 14.2 Full `vitest` suite 100% passing.
- [ ] 14.3 Determinism regression: a fixed-seed full run gives an identical sequence of draws, tosses, and shop offers across two runs (uses the RNG draw-order contract + `state()`/`restore()`).
- [ ] 14.4 Boundary sweep: 1, 2, 3, 5 tossed coins against all 6 tiers, through the full `scoreHand` pipeline.
- [ ] 14.5 Guard: grep confirms no `Math.random()` in `src/core/` or `src/state/`.

## Exit gate

`npm test` 100% green; determinism regression + boundary sweep pass; no `Math.random` in engine/store. (Charter M4: full suite green.)
