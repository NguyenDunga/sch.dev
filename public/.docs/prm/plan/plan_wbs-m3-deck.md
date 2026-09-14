# M3 — Deck & Draw Pile

**Depends:** M1, M2 · **Files:** `src/core/deck.ts` (+`.test.ts`) · **Source:** [Balance Baseline](plan_balance-baseline.md) → Deck & Deck Size Calc · Conventions: [overview](plan_wbs-overview.md).

*Goal: the coin-collection lifecycle. The draw pile is finite per blind — no mid-blind reshuffle; the hand shrinks on deck-out.*

## Contract

```ts
// all PURE — return new arrays, never mutate inputs
export function createBaseDeck(): Coin[];                              // BASE_DECK_SIZE plain coins (effects:[])
export function shuffleIntoDrawPile(deck: Coin[], rng: Rng): Coin[];
export function drawCoins(drawPile: Coin[], count: number): { drawn: Coin[]; drawPile: Coin[] };
export function discardCoins(discardPile: Coin[], coins: Coin[]): Coin[];
```

Use `BASE_DECK_SIZE` from `balance.ts`; base coins have unique `id`, `isHeads:null`, `effects:[]`.

## Checkpoints

- [ ] 3.1 `createBaseDeck()` → `BASE_DECK_SIZE` plain coins, distinct ids.
- [ ] 3.2 `shuffleIntoDrawPile` — seed-deterministic order, same multiset of ids.
- [ ] 3.3 `drawCoins` — takes up to `count` from the top; short pile → `drawn.length < count` (no padding).
- [ ] 3.4 `discardCoins` — append, input unmutated.
- [ ] 3.5 Test: over-draw returns only what's available, no throw.
- [ ] 3.6 Test: no function reshuffles discard→draw within a blind (drain the pile, it stays empty).
- [ ] 3.7 Test: blind-start reset → `drawPile.length === deck.length`, `discardPile` empty.

## Exit gate

`npx vitest run src/core/deck.test.ts` green; finite-pile behaviour proven; functions verified pure.
