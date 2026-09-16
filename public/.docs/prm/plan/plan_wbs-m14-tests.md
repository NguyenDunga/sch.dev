# M14 — Test Suite Completion

**Depends:** M2–M11 · **Files:** `*.test.ts` across `src/core/`, `src/state/` · **Source of truth:** [Charter](../init/init_project_charter.md) §2 obj 5; [Testing Strategy](plan_testing-strategy.md) · Conventions: [overview](plan_wbs-overview.md).

*Goal: consolidate and confirm coverage before README/ship.*

## Checkpoints

- [x] 14.1 Every core module (rng, deck, scoring) and the run store has a `*.test.ts`.
  - `src/core/rng.test.ts`, `src/core/deck.test.ts`, `src/core/scoring.test.ts`, `src/state/handFlow.test.ts` (57 tests covering the run store lifecycle).
- [x] 14.2 Full `vitest` suite 100% passing.
  - 424 tests across 33 files, all green.
- [x] 14.3 Determinism regression: a fixed-seed full run gives an identical sequence of draws, tosses, and shop offers across two runs (uses the RNG draw-order contract + `state()`/`restore()`).
  - `src/core/m14-determinism.test.ts` — runs a 3-blind loop (draw → pick → confirm → score → shop → leave) with a fixed seed and asserts the full observable trace is identical across two runs. Also verifies the RNG state/restore contract mid-run.
- [x] 14.4 Boundary sweep: 1, 2, 3, 5 tossed coins against all 6 tiers, through the full `scoreHand` pipeline.
  - `src/core/m14-boundary-sweep.test.ts` — 24 tests covering every coin count (1, 2, 3, 4, 5) × tier combination through `matchTier` + `scoreHand`, including charm boosters and boss rules.
- [x] 14.5 Guard: grep confirms no `Math.random()` in `src/core/` or `src/state/`.
  - `src/core/m14-no-math-random.test.ts` — recursively scans all non-test `.ts`/`.tsx` files in `src/core/` and `src/state/`, skipping comment lines, and fails if `Math.random(` appears.

## Exit gate

`npm test` 100% green; determinism regression + boundary sweep pass; no `Math.random` in engine/store. (Charter M4: full suite green.)

**Status: COMPLETE.** 424 tests / 33 files passing. `tsc --noEmit` clean. `eslint` clean.
