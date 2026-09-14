# M9 — Shop

**Depends:** M7, M8 · **Files:** `src/core/shop.ts` (+`.test.ts`); prices in `balance.ts` · **Source:** [Scope Statement](plan_scope-statement.md) → Shop · Conventions: [overview](plan_wbs-overview.md).

*Goal: between-blind shop — 5 offers, exactly 1 free reroll, merge, remove.*

## Contract

```ts
export interface Shop { offers: ShopOffer[]; rerollUsed: boolean; }   // 5 offers
export function generateShopOffers(rng: Rng, run: RunState): Shop;
export function rerollShop(rng: Rng, run: RunState, shop: Shop): Shop;                    // once only
export function buyOffer(run: RunState, offer: ShopOffer): RunState | { error: string };
export function mergeCoins(run: RunState, targetId: CoinId, sourceId: CoinId): RunState;  // free
export function removeCoin(run: RunState, id: CoinId): RunState | { error: string };      // costs $1
```

## Checkpoints

- [ ] 9.1 `generateShopOffers` → 5 offers from {unowned charms, special coins, hand-size upgrade}.
- [ ] 9.2 `rerollShop` — 1 free reroll, regenerates all 5, sets `rerollUsed`; second call is a no-op.
- [ ] 9.3 `buyOffer` — deduct price, add item; `{error}` if broke or charm already owned (run unchanged).
- [ ] 9.4 `mergeCoins` — source's effects fold into target (M7 `mergeEffects`), source removed, free.
- [ ] 9.5 `removeCoin` — flat $1 delete; `money` only decreases, never refunds.
- [ ] 9.6 Hand-size upgrade — `handSize += step` (balance.ts), up to cap; past cap → `{error}`.
- [ ] 9.7 Test: reroll usable exactly once per shop.
- [ ] 9.8 Test: buying an owned charm → `{error}`.
- [ ] 9.9 Test: remove costs $1, no refund.
- [ ] 9.10 Test: no `sell` export exists.

## Exit gate

`npx vitest run src/core/shop.test.ts` green; one-reroll, no-duplicate-charm, $1-delete rules proven.
