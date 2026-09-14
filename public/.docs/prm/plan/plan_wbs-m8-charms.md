# M8 — Charms

**Depends:** M6 · **Files:** `src/core/charms.ts` (+`.test.ts`); data in `balance.ts` `CHARM_POOL` · **Source:** [Balance Baseline](plan_balance-baseline.md) → Charm Pool · Conventions: [overview](plan_wbs-overview.md).

*Goal: the 5-charm pool, ownership, left-to-right order (= `ownedCharms` array order, no index field).*

The 5: **plusChips, plusMult, extraHand, payday, jackpotFever**.

## Contract

```ts
export const CHARM_POOL: Charm[];                                                    // exactly 5
export function reorderCharms(charms: Charm[], from: number, to: number): Charm[];  // pure array move
export function ownsCharm(owned: Charm[], id: CharmId): boolean;
```

## Checkpoints

- [ ] 8.1 Define the 5-charm pool (id/name/kind) — `CHARM_POOL.length === 5`.
- [ ] 8.2 `ownedCharms` array order is the only ordering source.
- [ ] 8.3 `reorderCharms` pure move: `[a,b,c]`,0→2 = `[b,c,a]`, input unchanged.
- [ ] 8.4 No-duplicates enforced at shop (M9) via `ownsCharm`.
- [ ] 8.5 Grep: Weighted Coin / Double-Sided / Always Heads / Re-Toss absent.
- [ ] 8.6 Test: reorder changes scoring only for `plusChips`+`jackpotFever` (ties to M6.6).

## Exit gate

`npx vitest run src/core/charms.test.ts` green; pool is exactly the 5; reorder pure; removed charms absent.
