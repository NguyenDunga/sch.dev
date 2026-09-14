# M1 — Core Data Types

**Depends:** M0 · **File:** `src/core/types.ts` (single source for all shared types) · **Source:** [Scope Statement](plan_scope-statement.md) → Core Rules; [Balance Baseline](plan_balance-baseline.md) · Conventions: [overview](plan_wbs-overview.md).

*Goal: define every shared shape once. Types only — no logic, no defaults. Every later milestone imports from here; names are load-bearing.*

## Contract

```ts
export type CoinId = string;

export type CoinEffect =                       // 9 v1 variants (odds/prices in balance.ts COIN_CATALOG)
  | { kind: 'weight'; face: boolean }          // 75/25 toward fixed face (rolled on purchase)
  | { kind: 'doubleSide'; face: boolean }      // 100/0 fixed face
  | { kind: 'chaos' }                          // uniform random odds each flip
  | { kind: 'echo' }                           // re-flip once per hand
  | { kind: 'magnetic' }                       // 75/25 toward left neighbour's face
  | { kind: 'reverse' }                        // invert rolled face
  | { kind: 'tax' }                            // +$1/hand
  | { kind: 'jackpot' }                        // 25% -> +$4/hand
  | { kind: 'draw'; n: 1 | 2 | 3 };            // discard -> redraw n

export interface Coin { id: CoinId; isHeads: boolean | null; effects: CoinEffect[]; }

export type CharmId = 'plusChips' | 'plusMult' | 'extraHand' | 'payday' | 'jackpotFever';
export interface Charm { id: CharmId; name: string; kind: 'booster' | 'other'; }

export enum Tier { Jackpot='jackpot', FourInARow='fourInARow', Alternating='alternating',
  FourSame='fourSame', TripleRun='tripleRun', ThreeSame='threeSame' }   // minCoins carried by TIER_TABLE

export enum HandPhase { Draw='draw', Play='play', Toss='toss', Buff='buff', Score='score' }

export type RoundIndex = 0|1|2|3;
export type BlindIndex = 0|1|2;                // small, big, boss
export type BossRuleId = 'noAlternating'|'shortFuse'|'noJackpots'|'heavyTarget';
export interface BossRule { id: BossRuleId; round: RoundIndex; }

export type ShopOffer =
  | { kind: 'charm'; charmId: CharmId; price: number }
  | { kind: 'specialCoin'; effect: CoinEffect; price: number }
  | { kind: 'handSizeUpgrade'; price: number };

export interface RunState {
  seed: string; deck: Coin[]; drawPile: Coin[]; hand: Coin[]; discardPile: Coin[];
  money: number; roundIndex: RoundIndex; blindIndex: BlindIndex;
  handsLeft: number; blindTarget: number; blindTotal: number;
  ownedCharms: Charm[];        // array order == charm-bar order
  handSize: number;            // starts at HAND_SIZE_START
  phase: HandPhase;
}
```

`blindTotal` and `phase` are additions to the original RunState list (the pipeline and phase machine need them).

## Checkpoints

- [ ] 1.1–1.8 Define each shape above verbatim: `Coin`, `CoinEffect` (exactly 9), `Charm`/`CharmId` (5), `Tier` (6), `HandPhase`, `RunState`, `BossRule`/`BossRuleId` (4), `ShopOffer` (3).
- [ ] 1.9 All exported from one `types.ts`; no runtime logic, no defaults.
- [ ] 1.10 `tsc --noEmit` clean.

## Exit gate

`tsc --noEmit` clean; member counts exact (9 effects / 5 charms / 6 tiers / 4 boss rules); `types.ts` has no runtime code.
