# M5 — Pattern / Tier Matching

**Depends:** M1 · **Files:** `src/core/tiers.ts` (+`.test.ts`); tier data in `balance.ts` `TIER_TABLE` · **Source:** [Balance Baseline](plan_balance-baseline.md) → Pattern Tiers · Conventions: [overview](plan_wbs-overview.md).

*Goal: return the single highest-value tier for the tossed faces, or `null`. Pure. Input is only the tossed faces (empty slots aren't passed), so a k-coin play only matches tiers that fit in k.*

## Contract

```ts
export function matchTier(faces: boolean[]): Tier | null;   // faces.length 1..5, no placeholders
```

Tier rules (Heads = true), **priority high→low**:
1. **Jackpot** — exactly 5, all identical (minCoins 5)
2. **FourInARow** — a run of ≥4 adjacent equal faces (minCoins 4)
3. **Alternating** — exactly 5, strictly alternating `HTHTH`/`THTHT` (minCoins 5)
4. **FourSame** — some face value appears ≥4 times, not necessarily adjacent (minCoins 4)
5. **TripleRun** — a run of ≥3 adjacent equal faces (minCoins 3)
6. **ThreeSame** — a face value appears exactly 3 times (minCoins 3)

Return the first (highest) that matches, else `null`. `4-same` = a **count**; `4-in-a-row` = a **run** — both can hold (`HHHHT` → FourInARow wins). `HHHTT` → TripleRun (outranks ThreeSame).

## Checkpoints

- [ ] 5.1 `matchTier` skeleton (length 1..5).
- [ ] 5.2–5.7 Detect each tier: 3-same, 4-same, Jackpot, 4-in-a-row, alternating, triple-run.
- [ ] 5.8 Priority resolution: highest match wins.
- [ ] 5.9 ≤2-coin play → `null`.
- [ ] 5.10 Test: one case per tier at its minimum coin count.
- [ ] 5.11 Test: any 2-coin play → `null`.
- [ ] 5.12 Test: `[H,H,H,H,H]` → Jackpot (not 4-in-a-row/4-same/triple-run).

## Exit gate

`npx vitest run src/core/tiers.test.ts` green; all 6 tiers detected at min coins; priority + ≤2-coin→null proven.
