# M6 — Scoring Pipeline

**Depends:** M5 · **File:** `src/core/scoring.ts` (export `scoreHand`) (+`.test.ts`); values in `balance.ts` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3; [Scope Statement](plan_scope-statement.md) → Scoring Pipeline · Conventions: [overview](plan_wbs-overview.md).

*Goal: the exact pipeline, in order, no steps merged. Score = chips × mult; coin cash paid separately.*

## Contract (SDD C3)

```ts
export function scoreHand(play: Play, boss: BossRule | null, charms: CharmId[], rng: Rng): Score
// Score = { tier: TierId; chips: number; mult: number; total: number; cash: number }
```

Steps, in order:
1. **Tier** — `matchTier(play, boss)` (boss tier rules already applied inside M5).
2. **Base** — `{chips, mult}` from `TIERS[tier]`; `null` tier → `{0, 0}`.
3. **Boosters** — iterate `charms` left→right: `plusChips` chips+=10; `plusMult` mult+=1; `jackpotFever` if tier==='jackpot' chips*=2. Only these three, this order. (Magnitudes from `CHARMS`/`balance.ts`.)
4. **Score** — `total = chips * mult`.
5. **Coin cash** — `$1 × each Tax coin in the play` (deterministic) + `$4 × each Jackpot coin passing its 25% roll` via `rng` (never `Math.random`).

## Checkpoints

- [x] 6.1 Tier step via `matchTier`.
- [x] 6.2 Base step (null → 0/0).
- [x] 6.3 Boosters step, left→right, only the 3.
- [x] 6.4 `total = chips × mult`.
- [x] 6.5 Coin cash: Tax deterministic, Jackpot via `rng`.
- [x] 6.6 Test: charms `[plusChips, jackpotFever]` → `(C+10)*2` chips vs `[jackpotFever, plusChips]` → `C*2+10` — totals differ.
- [x] 6.7 Test: no charms → total = baseChips × baseMult.
- [x] 6.8 Test: Tax cash calls no rng (spy).
- [x] 6.9 Test: same seed → identical Jackpot cash.
- [x] 6.10 Test: null tier → total 0 and $0 tier cash, but per-coin Tax/Jackpot still pays.

*Keep the existing exhaustive 32-hand EV test; compute the expected EV from `TIERS`, don't hardcode.*

## Exit gate

`npx vitest run src/core/scoring.test.ts` green; pipeline order preserved; 6.6 and 6.9 proven. (Charter M2: scoring green.)
