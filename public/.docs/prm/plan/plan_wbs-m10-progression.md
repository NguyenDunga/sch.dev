# M10 — Blind / Round / Boss Progression

**Depends:** M4, M6 · **Files:** `src/core/progression.ts` (+`.test.ts`); tables in `balance.ts`; transitions in `src/state/runStore.ts` · **Source:** [Balance Baseline](plan_balance-baseline.md) → Targets, Boss Rules · Conventions: [overview](plan_wbs-overview.md).

*Goal: 4 rounds × 3 blinds (small/big/boss), escalating targets, 4 fixed boss rules.*

## Contract

```ts
export function getBlindTarget(round: RoundIndex, blind: BlindIndex): number;   // BLIND_TARGETS
export function getBossRule(round: RoundIndex): BossRuleId;                      // BOSS_RULES
export function isBossBlind(blind: BlindIndex): boolean;                         // blind === 2
export function startBlind(run: RunState, rng: Rng): RunState;
export function resolveBlindEnd(run: RunState): 'cleared' | 'gameover' | 'continue';
```

Boss rules by round: 0 `noAlternating`, 1 `shortFuse` (fewer hands), 2 `noJackpots`, 3 `heavyTarget` (target ×1.5 + bonus). Tiering effects act in M6; hand-count/target effects act here. `HANDS_PER_BLIND` from `balance.ts`.

## Checkpoints

- [ ] 10.1 `getBlindTarget` — per round, `target(0)<target(1)<target(2)`.
- [ ] 10.2 `getBossRule` — one fixed rule per round; applied only on boss blinds.
- [ ] 10.3 `startBlind` — reshuffle full deck, clear discard, `handsLeft=HANDS_PER_BLIND` (−2 on shortFuse boss), `blindTotal=0`, `phase=Draw`.
- [ ] 10.4 `resolveBlindEnd` — `>=target`→cleared; else `handsLeft===0`→gameover; else continue.
- [ ] 10.5 Clearing round-3 boss (round 3, blind 2) → win.
- [ ] 10.6 Test: round-N boss rule fires only on that boss blind, not its small/big.
- [ ] 10.7 Test: miss target after `HANDS_PER_BLIND` hands → gameover (even with money left).
- [ ] 10.8 Test: full 12-blind walk (mocked clears) reaches win, no undefined transition.

## Exit gate

`npx vitest run src/core/progression.test.ts` green; boss rules scoped correctly; win + gameover reached cleanly. (Charter M3: state green.)
