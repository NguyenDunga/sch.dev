# M7 — Coin Effects (v1 Core Set of 9)

**Depends:** M4, M6 · **Files:** `src/core/scoring.ts` (`resolveFace` + coin cash), `src/core/balance.ts` (`COIN_EFFECTS`), merge in `src/state/runStore.ts`; tests in `scoring.test.ts` · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C3; [Balance Baseline](plan_balance-baseline.md) → Coin Effects · Conventions: [overview](plan_wbs-overview.md).

*Goal: implement each of the 9 effect types in isolation, then combine. Effects are `CoinEffectId`s on a coin; a coin can hold several (via merge).*

The 9 effect types: **weight, doubleSide, chaos, echo, magnetic, reverse, tax, jackpot, draw** (draw as draw1/2/3).

## Contract (SDD C3)

```ts
export function resolveFace(rng: Rng, coin: Coin, leftFace: Face | null): Face
// odds stage -> roll -> Reverse. Echo re-flip (buff phase) = call resolveFace again.
```

**Odds-stage priority** (highest present wins): magnetic (75% toward `leftFace`; none if left empty) > doubleSide (100/0 toward `coin.faceParams.doubleSide`) > chaos (uniform odds) > weight (75/25 toward `coin.faceParams.weight`) > base (50/50). Then roll, then Reverse inverts. Percentages in `COIN_EFFECTS`. Cash (Tax/Jackpot) is paid in `scoreHand` step 5 (M6); Draw-N and Echo are driven by the store (`discard`, `echoReflip`, M4).

## Checkpoints

- [ ] 7.1 Comment block at the top of `scoring.ts`' effect section listing the 9 (face / cash / draw).
- [ ] 7.2 Face effects (weight, doubleSide, chaos, magnetic, reverse) via the priority above, reading `coin.faceParams`.
- [ ] 7.3 Cash effects: Tax (+$1, deterministic), Jackpot (25%→+$4 via rng) in `scoreHand`.
- [ ] 7.4 Draw-enchant: store `discard` on a `draw1/2/3` coin redraws N (M4.4).
- [ ] 7.5 Echo: store `echoReflip` re-runs `resolveFace` once per Echo coin (M4.7).
- [ ] 7.6 Merge (store `mergeCoin`): target gains source's effects (stack, no cap); `faceParams` carried per-effect; free.
- [ ] 7.7 One isolated test per effect type (9).
- [ ] 7.8 Test: a merged coin (e.g. Weight + Double-Side, or Tax + a face effect) resolves correctly.
- [ ] 7.9 Do NOT implement the 16 future effects (Extra, Shapeshift, Momentum, Interest, Gambler, Mirror, Anchor, Parasite, Conductor, Cursed, Unstable, Time Bomb, Phoenix, Duplicator, Sacrifice, Insurance); grep confirms zero matches.

## Exit gate

`npx vitest run src/core/scoring.test.ts` green (effects subset); 9 isolated tests pass; merge (incl. two face effects) proven; zero out-of-scope effects.
