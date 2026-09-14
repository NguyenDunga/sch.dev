# M11 — Save / Load

**Depends:** M10 · **Files:** `src/core/save.ts` (+`.test.ts`); persist wiring in `src/state/runStore.ts` · **Source:** [Scope Statement](plan_scope-statement.md) → Core Rules (Save) · Conventions: [overview](plan_wbs-overview.md).

*Goal: manual localStorage save, resume at blind start only. No autosave. This is the one engine module allowed to touch `localStorage`.*

## Contract

```ts
export const SAVE_KEY = 'fifty-fifty-run';
export function saveRun(state: RunState): void;                           // explicit only
export function loadRun(): RunState | null;                              // null if absent/corrupt
export function resumeToBlindStart(state: RunState, rng: Rng): RunState;  // fresh pile, empty discard, handsLeft reset
```

Tests use jsdom `localStorage` or an in-memory stub.

## Checkpoints

- [ ] 11.1 `saveRun` — serialize full `RunState` to `SAVE_KEY`, explicit calls only.
- [ ] 11.2 `loadRun` — deserialize; `null` if none or parse fails.
- [ ] 11.3 `resumeToBlindStart` — always blind start: reshuffle, empty discard, `handsLeft` reset, `blindTotal=0`, never mid-hand.
- [ ] 11.4 Test: save → load (fresh instance) deep-equals persisted fields.
- [ ] 11.5 Test: no phase transition calls `saveRun` (spy `not.toHaveBeenCalled`).

## Exit gate

`npx vitest run src/core/save.test.ts` green; round-trip equal; resume at blind start; no autosave on any transition path.
