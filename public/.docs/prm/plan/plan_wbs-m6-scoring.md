# M6 — Scoring Pipeline

**Depends:** M5 · **Files:** `src/core/scoring.ts` (+`.test.ts`); base values in `balance.ts` · **Source:** [Scope Statement](plan_scope-statement.md) → Scoring Pipeline · Conventions: [overview](plan_wbs-overview.md).

*Goal: the exact pipeline, in order, no steps merged. `chips × mult` for score; cash paid separately.*

## Contract

```ts
export interface ScoreInput { faces: boolean[]; playedCoins: Coin[]; ownedCharms: Charm[]; bossRule: BossRuleId | null; rng: Rng; }
export interface ScoreResult { tier: Tier | null; chips: number; mult: number; total: number; cash: number; }
export function scoreHand(input: ScoreInput): ScoreResult;
```

Steps, in order:
1. **Tier** — `matchTier(faces)`, then boss rule (`noAlternating`: Alternating→null; `noJackpots`: Jackpot→FourSame).
2. **Base** — `{chips,mult} = TIER_TABLE[tier]`; `null` → `{0,0}`.
3. **Boosters** — iterate `ownedCharms` left→right: `plusChips` chips+=10; `plusMult` mult+=1; `jackpotFever` if tier===Jackpot chips*=2. Only these three, this loop order.
4. **Score** — `total = chips * mult`.
5. **Coin cash** — `$1 × Tax coins` (deterministic) + `$4 × each Jackpot coin passing its 25% roll` via `input.rng` (never `Math.random`).

## Checkpoints

- [ ] 6.1 Tier step incl. boss modifier.
- [ ] 6.2 Base step (null → 0/0).
- [ ] 6.3 Boosters step, left→right, only the 3.
- [ ] 6.4 Score = chips × mult.
- [ ] 6.5 Coin cash: Tax deterministic, Jackpot via rng.
- [ ] 6.6 Test: `[plusChips, jackpotFever]` → `(C+10)*2` chips vs `[jackpotFever, plusChips]` → `C*2+10` — totals differ.
- [ ] 6.7 Test: no charms → total = baseChips × baseMult.
- [ ] 6.8 Test: Tax cash calls no rng (spy).
- [ ] 6.9 Test: same seed → identical Jackpot cash.
- [ ] 6.10 Test: null tier → total 0 and $0 tier cash, but per-coin Tax/Jackpot still pays.

*Keep the existing exhaustive 32-hand EV test; compute expected EV from `TIER_TABLE`, don't hardcode.*

## Exit gate

`npx vitest run src/core/scoring.test.ts` green; 10-step order preserved; 6.6 and 6.9 proven. (Charter M2: scoring green.)
