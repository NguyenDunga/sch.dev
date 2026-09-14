# M10 — Blind / Round / Boss Progression

**Depends:** M4, M6 · **Files:** `src/core/balance.ts` (`BLINDS`, `BOSS_RULES`), transitions in `src/state/runStore.ts` (+`.test.ts`) · **Source of truth:** [SDD Component Design](../../sdd/software_design_component.md) C4 + Run State Machine; [Balance Baseline](plan_balance-baseline.md) → Targets, Boss Rules · Conventions: [overview](plan_wbs-overview.md).

*Goal: the 4-round × 3-blind (small/big/boss) structure, escalating targets, and the 4 fixed boss rules. Blind data is a table; transitions are store actions.*

## Contract

```ts
// balance.ts
export const BLINDS: Blind[]        // 12 entries indexed by blindIndex 0..11; each { round, kind, target, reward, boss? }
export const BOSS_RULES: BossRule[] // 4, one per round: noAlternating, shortFuse, noJackpots, heavyTarget
// runStore.ts (SDD C4)
score()      // at handsLeft === 0 -> endBlind()
endBlind()   // target met: cash += reward (+ Payday, + Heavy Target bonus); blind 11 -> runEnd(win); else -> shop.  target missed -> runEnd(lose)
leaveShop()  // next blind: reset handsLeft (10; SHORT_FUSE_HANDS on Short Fuse; +1 Extra Hand), blindScore=0, hand/play; shuffleCollection; clear discard; phase='run'
```

Boss rules act where they apply: tier effects (`noAlternating`, `noJackpots`) in `matchTier` (M5); hand count (`shortFuse`) and target (`heavyTarget` ×1.5 + bonus) here. A blind's boss is `BLINDS[blindIndex].boss` (set on boss blinds only).

## Checkpoints

- [ ] 10.1 `BLINDS[12]` — per round small<big<boss, escalating; targets/rewards from balance-baseline.
- [ ] 10.2 `BOSS_RULES[4]` — one per round; `BLINDS[i].boss` set only on boss blinds.
- [ ] 10.3 `leaveShop` — reshuffle, clear discard, reset `handsLeft` (Short Fuse → `SHORT_FUSE_HANDS`; Extra Hand → +1), `blindScore=0`, `phase='run'`.
- [ ] 10.4 `endBlind` — target met → reward + advance (shop, or runEnd win after blind 11); target missed → runEnd lose.
- [ ] 10.5 Clearing blind index 11 (round 4 boss) → `won = true`, `phase='runEnd'`.
- [ ] 10.6 Test: a round's boss rule fires only on its boss blind, not its small/big.
- [ ] 10.7 Test: miss target after the blind's hand budget → lose (even with cash left).
- [ ] 10.8 Test: full 12-blind walk (mocked clears) reaches win with no undefined transition.

## Exit gate

`npx vitest run src/state/runStore.test.ts` green (progression subset); boss rules scoped correctly; win + lose reached cleanly. (Charter M3: state green.)
