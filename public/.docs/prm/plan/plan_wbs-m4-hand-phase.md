# M4 — Hand Phase State Machine

**Depends:** M1, M3 · **Files:** `src/core/handMachine.ts` (+`.test.ts`), wired into `src/state/runStore.ts` later · **Source:** [Scope Statement](plan_scope-statement.md) → Hand Phase Flow · Conventions: [overview](plan_wbs-overview.md).

*Goal: enforce `Draw → Play → Toss → Buff → Score → (next) Draw` with no skipping. Pure reducer, no UI.*

## Contract

```ts
export type HandAction =
  | { type: 'selectCoinsToPlay'; ids: CoinId[] }   // Play; 1..5
  | { type: 'discardFromHand'; ids: CoinId[] }      // Play
  | { type: 'confirmPlay' }                          // Play -> Toss
  | { type: 'reflipEcho'; coinId: CoinId }           // Buff; once per Echo coin
  | { type: 'confirmBuff' }                          // Buff -> Score
  | { type: 'confirmScore' };                        // Score -> Draw
export function advancePhase(state: RunState, action: HandAction, rng: Rng): RunState;  // pure
```

Draw & Toss are automatic (do their work on entry, then auto-advance). An action in the wrong phase returns state **unchanged** (no throw). `PLAY_MIN=1`, `PLAY_MAX=5`, `handSize` from state/`balance.ts`.

## Checkpoints

- [ ] 4.1 Reducer covers exactly the 5-phase cycle.
- [ ] 4.2 Draw (auto): draw `handSize` face-down (`isHeads:null`) → Play.
- [ ] 4.3 Play `selectCoinsToPlay`: reject (unchanged) if count 0 or >5.
- [ ] 4.4 Play `discardFromHand`: plain → discard (gone for blind); `draw:n` coin → redraw n instead.
- [ ] 4.5 Play `confirmPlay`: lock 1–5 → Toss; unselected set aside (not yet discarded).
- [ ] 4.6 Toss (auto): resolve each face via M7 `resolveFace` (stub = plain 50/50 until M7); set `isHeads` → Buff.
- [ ] 4.7 Buff `reflipEcho`: once per Echo coin; second reflip on same id is a no-op.
- [ ] 4.8 Buff `confirmBuff`: apply charms (M6 stub) → Score.
- [ ] 4.9 Score `confirmScore`: run M6 (stub), add to `blindTotal`, move ALL hand coins (tossed+unpicked) to discard, `handsLeft-=1` → Draw.
- [ ] 4.10 Test: out-of-phase action is a no-op.
- [ ] 4.11 Test: full cycle runs; `handsLeft` −1; back to Draw.
- [ ] 4.12 Test: after Score, `hand` empty and both tossed + unpicked coins are in discard.

## Exit gate

`npx vitest run src/core/handMachine.test.ts` green; illegal actions no-op; a cycle empties the hand and decrements `handsLeft`. (Toss/Buff/Score use stubs; M6/M7 fill them and re-run these tests.)
