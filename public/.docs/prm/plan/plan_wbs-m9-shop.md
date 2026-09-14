# M9 — Shop

**Depends:** M7, M8 · **File:** `src/state/runStore.ts` (+`.test.ts`); prices/pool in `src/core/balance.ts` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C4/C8; [Scope Statement](plan_scope-statement.md) → Shop · Conventions: [overview](plan_wbs-overview.md).

*Goal: the between-blind shop — 5 offers, exactly 1 free reroll, merge, remove, hand-size upgrade. All shop logic lives in the store (SDD C4).*

## Store actions (SDD C4)

```ts
// offers are generated on entering the shop (endBlind) and by reroll; shop = { offers: ShopOffer[]; rerollUsed: boolean }
buy(offer)                     // cash -= price; charm -> charms; coin -> collection (roll Weight/Double-Side faceParams); handSize -> handSize+1; reject if broke or charm owned
reroll()                       // if !rerollUsed: regenerate all offers (rng); rerollUsed = true
mergeCoin(fromId, toId)        // toId gains fromId's effects (stack, no cap); fromId removed; free
removeCoin(id)                 // remove coin from collection; cash -= REMOVE_COIN_COST ($1)
leaveShop()                    // next blind (M10)
```

Offers are drawn from: charms not yet owned + coin effects (COIN_EFFECTS) + a hand-size upgrade; `SHOP_SLOTS`=5, `FREE_REROLLS`=1, caps in `balance.ts`.

## Checkpoints

- [x] 9.1 Offer generation → 5 offers from {unowned charms, coins, hand-size upgrade}; no owned charm offered.
- [x] 9.2 `reroll` — usable once (`rerollUsed`); regenerates all 5; second call is a no-op.
- [x] 9.3 `buy` — deduct price, add item; reject (state unchanged) if `cash < price` or charm already owned.
- [x] 9.4 `buy` a coin rolls its `faceParams` (Weight/Double-Side) via rng and adds it to the collection.
- [x] 9.5 `mergeCoin` — effects stack onto target, source removed, free (`cash` unchanged).
- [x] 9.6 `removeCoin` — `cash -= REMOVE_COIN_COST`; delete only, never a refund.
- [x] 9.7 Hand-size upgrade — `handSize += 1` up to `HAND_SIZE_CAP`; past cap rejected.
- [x] 9.8 Test: reroll once per shop; buying an owned charm rejected.
- [x] 9.9 Test: remove costs $1, no refund; no "sell charm" action exists.

## Exit gate

`npx vitest run src/state/runStore.test.ts` green (shop subset); one-reroll, no-duplicate-charm, $1-delete (no sell-back) proven.
