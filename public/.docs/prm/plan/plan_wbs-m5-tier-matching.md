# M5 — Pattern / Tier Matching

**Depends:** M1 · **File:** `src/core/scoring.ts` (export `matchTier`) (+`.test.ts`); tier data in `balance.ts` `TIERS` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3; [Balance Baseline](plan_balance-baseline.md) → Pattern Tiers · Conventions: [overview](plan_wbs-overview.md).

*Goal: return the single highest-value tier for a play, or `null`. Pure. Empty (`null`) slots count as nothing — the pattern is read on the tossed `Slot.face` values only, so a k-coin play only matches tiers that fit in k.*

## Contract (SDD C3)

```ts
export function matchTier(play: Play, boss: BossRule | null): TierId | null
```

Read the faces from non-null slots (`play.filter(Boolean).map(s => s.face)`). Tier rules (`TierId`, priority high→low):
1. `jackpot` — exactly 5 faces, all identical (min 5)
2. `fourRow` — a run of ≥4 adjacent equal faces (min 4)
3. `alternating` — exactly 5 strictly alternating (min 5)
4. `fourSame` — some face appears ≥4 times, not necessarily adjacent (min 4)
5. `tripleRun` — a run of ≥3 adjacent equal faces (min 3)
6. `threeSame` — a face appears exactly 3 times (min 3)

Return the first (highest) match, else `null`. **Boss rules apply here:** `noAlternating` → an alternating match becomes `null` (explicit override, no fall-through); `noJackpots` → a `jackpot` match returns `fourSame` (fixed demotion, **not** a fall-through to `fourRow`).

## Checkpoints

- [x] 5.1 `matchTier(play, boss)` reads faces from non-null slots.
- [x] 5.2–5.7 Detect each tier: threeSame, fourSame, jackpot, fourRow, alternating, tripleRun.
- [x] 5.8 Priority: highest match wins (`HHHHH` → `jackpot`, never fourRow/fourSame/tripleRun).
- [x] 5.9 ≤2 non-null slots → `null`.
- [x] 5.10 Boss: `noAlternating` → alternating play returns `null`; `noJackpots` → 5-same returns `fourSame` (not `fourRow`).
- [x] 5.11 Test: one case per tier at its minimum coin count.
- [x] 5.12 Test: any 2-coin play → `null`.

## Exit gate

`npx vitest run src/core/scoring.test.ts` green (tier subset); all 6 tiers at min coins; priority, ≤2→null, and both tier-affecting boss rules proven.
