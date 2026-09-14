# M4 — Hand Phase State Machine

**Depends:** M1, M3 · **File:** `src/state/runStore.ts` (+`.test.ts`) · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C4 + Run State Machine; [Scope Statement](plan_scope-statement.md) → Hand Phase Flow · Conventions: [overview](plan_wbs-overview.md).

*Goal: the 5-phase per-hand flow `draw → play → toss → buff → score → (next) draw`, driven by `handPhase` in the zustand store (immer). No separate reducer module — the machine lives in the store, per the SDD.*

## Store actions (SDD C4)

```ts
drawHand()               // draw phase (auto): pop up to handSize via deck.drawFromDeck -> hand (null when short); handPhase = 'play'
pickCoin(handIndex)      // play: move a hand coin into the next free play slot (max 5); re-pick unpicks first
unpickCoin(slotIndex)    // play: return a play coin to the hand
discard(handIndex)       // play (unlimited): plain coin -> discardToPile; draw-enchant coin -> drawFromDeck ×N into hand
confirmPlay()            // play -> toss (requires ≥1 picked): resolveFace per picked coin in play order; handPhase = 'buff'
echoReflip(slotIndex)    // buff: if Echo and !echoUsed -> resolveFace again; echoUsed = true
score()                  // score: scoreHand -> blindScore += total, cash += cash; returnHandToPile (all hand coins); handsLeft -= 1; handPhase = 'draw' (or endBlind at 0)
```

Toss/Buff/Score call M6/M7 (`scoreHand`, `resolveFace`); stub those until then. An action fired in the wrong `handPhase` is a no-op.

## Checkpoints

- [x] 4.1 `handPhase` only ever moves along `draw→play→toss→buff→score→draw`.
- [x] 4.2 `drawHand` (auto): up to `handSize` coins face-down into `hand` (fewer if the pile is short); → `play`.

> **4.2 design decision (2026-09-14):** empty pile at hand start (reachable with hand-size upgrades / draw-enchant coins) would otherwise deadlock the machine (empty hand → nothing to pick → `confirmPlay` needs ≥1). Resolution: **auto-skip the hand** — `handsLeft −1`, no score, stays in `draw`. Recorded in SDD C4.
- [x] 4.3 `pickCoin` / `unpickCoin`: play slots hold 1–5; picking a 6th is a no-op; re-picking a played coin unpicks it first.
- [x] 4.4 `discard`: plain coin → discard (gone for the blind); `draw1/2/3` coin → redraw N into the hand.
- [ ] 4.5 `confirmPlay`: requires ≥1 picked; → `toss`; unpicked hand coins stay in `hand` (not discarded yet).
- [ ] 4.6 Toss (auto on `confirmPlay`): `resolveFace` per picked coin sets each `Slot.face`; → `buff`.
- [ ] 4.7 `echoReflip`: once per Echo coin (`echoUsed`); a second call on the same slot is a no-op.
- [ ] 4.8 `score`: run pipeline; `returnHandToPile` moves ALL hand coins (tossed + unpicked) to discard; `handsLeft -= 1`; → `draw`.
- [ ] 4.9 Test: any action out of its phase is a no-op.
- [ ] 4.10 Test: a full cycle runs; `handsLeft` −1; back to `draw`.
- [ ] 4.11 Test: after `score`, `hand` and `play` are empty and those coins are in `discardPile`.

## Exit gate

`npx vitest run src/state/runStore.test.ts` green (hand-phase subset); illegal-phase actions no-op; a cycle empties hand+play and decrements `handsLeft`. (Toss/Buff/Score use M6/M7 stubs until those land.)
