# M7 — Coin Effects (v1 Core Set of 9)

**Depends:** M4, M6 · **Files:** `src/core/coinEffects.ts` (+`.test.ts`); specs in `balance.ts` `COIN_CATALOG` · **Source:** [Balance Baseline](plan_balance-baseline.md) → Coin Effects · Conventions: [overview](plan_wbs-overview.md).

*Goal: implement each of the 9 effects in isolation, then combine. List the 9 first.*

The 9: **weight, doubleSide, chaos, echo, magnetic, reverse, tax, jackpot, draw(n)**.

## Contract

```ts
// face resolution: odds stage -> roll -> reverse -> (echo re-run once)
export function resolveFace(coin: Coin, leftNeighbourFace: boolean | null, rng: Rng): boolean;
export function collectCash(playedCoins: Coin[], rng: Rng): number;   // Tax + Jackpot
export function mergeEffects(target: Coin, source: Coin): Coin;       // stack, no cap
```

**Odds-stage priority** (highest wins): magnetic (75% toward left; none if left empty) > doubleSide (100/0) > chaos (uniform) > weight (75/25) > base (50/50). Then roll → reverse inverts → echo may re-run once (M4.7). Percentages in `COIN_CATALOG`.

## Checkpoints

- [ ] 7.1 Comment block listing the 9 (face / cash / draw categories).
- [ ] 7.2 Face effects (weight, doubleSide, chaos, magnetic, reverse) via the priority above.
- [ ] 7.3 Cash effects: tax (+$1, deterministic), jackpot (25%→+$4 via rng) — feeds M6.5.
- [ ] 7.4 Draw-enchant: `draw:n` on discard redraws n (M4.4).
- [ ] 7.5 Echo re-flip (M4.7).
- [ ] 7.6 `mergeEffects`: target gains source's effects, free.
- [ ] 7.7 One isolated test per effect (9).
- [ ] 7.8 Test: a merged coin (e.g. tax + face effect) resolves both in one toss.
- [ ] 7.9 Do NOT implement the 16 future effects (Extra, Shapeshift, Momentum, Interest, Gambler, Mirror, Anchor, Parasite, Conductor, Cursed, Unstable, Time Bomb, Phoenix, Duplicator, Sacrifice, Insurance); grep confirms zero matches.

## Exit gate

`npx vitest run src/core/coinEffects.test.ts` green; 9 isolated tests pass; merge proven; zero out-of-scope effects.
