# M8 — Charms

**Depends:** M6 · **Files:** `src/core/balance.ts` (`CHARMS`), boosters in `src/core/scoring.ts`, `moveCharm` in `src/state/runStore.ts`; tests in `scoring.test.ts` / `runStore.test.ts` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3/C4/C7; [Balance Baseline](plan_balance-baseline.md) → Charm Pool · Conventions: [overview](plan_wbs-overview.md).

*Goal: the 5-charm pool, ownership, and left-to-right order (= `RunState.charms` array order, no index field).*

The 5 (`CharmId`): **plusChips, plusMult, extraHand, payday, jackpotFever**, each a `CharmDef { id, name, category, price }` in `CHARMS`.

## Contract

```ts
// balance.ts
export const CHARMS: CharmDef[]                                 // exactly 5
// runStore.ts
moveCharm(from: number, to: number)                            // reorder RunState.charms (scoring order)
// ownership check for the shop (M9): charms.includes(id)
```

## Checkpoints

- [ ] 8.1 `CHARMS` = the 5 defs (id/name/category/price); `CHARMS.length === 5`; categories are `flip|scoring|pattern|economy`.
- [ ] 8.2 `RunState.charms: CharmId[]` array order is the only ordering source.
- [ ] 8.3 `moveCharm(from, to)` reorders `charms` (pure array move within the store).
- [ ] 8.4 No-duplicates enforced at the shop (M9) via `charms.includes(id)`.
- [ ] 8.5 Grep: Weighted Coin / Double-Sided / Always Heads / Re-Toss absent from charms + types.
- [ ] 8.6 Test: reordering changes scoring only for `plusChips`+`jackpotFever` on a Jackpot hand (ties to M6.6).

## Exit gate

`vitest` green for the charm subset; pool is exactly the 5; `moveCharm` is a clean reorder; removed charms absent.
