# M3 — Deck & Draw Pile

**Depends:** M1, M2 · **Files:** `src/core/deck.ts` (+`.test.ts`) · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C11; [Balance Baseline](plan_balance-baseline.md) → Deck & Deck Size Calc · Conventions: [overview](plan_wbs-overview.md).

*Goal: the coin-collection lifecycle (Balatro-style). The draw pile is finite per blind — no mid-blind reshuffle; the hand shrinks on deck-out. All functions pure.*

## Contract (SDD C11)

```ts
export function buildCollection(): Deck                        // BASE_DECK_SIZE plain coins (effects:[]); fresh run
export function shuffleCollection(rng: Rng, deck: Deck): Deck  // blind start: merge piles -> Fisher–Yates -> drawPile; discardPile = []
export function drawFromDeck(deck: Deck): Option<Coin>       // peek draw pile (no rng); none when empty
export function discardToPile(deck: Deck, coin: Coin): Deck    // coin -> discardPile
export function returnHandToPile(deck: Deck, hand: Hand): Deck // after scoring: all hand coins -> discardPile
```

`buildCollection` uses `BASE_DECK_SIZE` from `balance.ts` (do not hardcode). The store draws a hand by calling `drawFromDeck` up to `handSize` times (M4).

> **3.3 reconciliation (2026-09-14):** the original “pop + `Coin | null`” wording was v1.0-era. Per SDD C11 (source of truth) and the null-free model (M1.pre), `drawFromDeck` is a **peek** returning `Option<Coin>` — `none` when empty; the caller pops (`drawPile.slice(1)`) after taking the coin.

## Checkpoints

- [x] 3.1 `buildCollection()` → `BASE_DECK_SIZE` plain coins, distinct ids, `effects: []`.
- [x] 3.2 `shuffleCollection(rng, deck)` — merges drawPile+discardPile, Fisher–Yates with `rng`, clears discard; seed-deterministic order; same multiset of ids.
- [x] 3.3 `drawFromDeck(deck)` — peeks the next coin (no rng); returns `none` when the draw pile is empty (hand shrinks — no placeholder coin).
- [x] 3.4 `discardToPile` / `returnHandToPile` — append to discard; inputs unmutated.
- [ ] 3.5 Test: drawing from an empty pile returns `none`, no throw.
- [ ] 3.6 Test: no function moves discard→draw within a blind (drain the pile; it stays empty; discard grows).
- [ ] 3.7 Test: `shuffleCollection` clears the discard pile and the resulting drawPile length equals the collection size.

## Exit gate

`npx vitest run src/core/deck.test.ts` green; finite-pile behaviour proven; functions verified pure.
