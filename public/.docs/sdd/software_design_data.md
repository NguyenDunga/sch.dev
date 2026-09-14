# Data Design: 50/50

Part of the [Software Architecture](software_design_architechture.md). Balance values: [Balance Baseline](../prm/plan/plan_balance-baseline.md).

## Core Types (`src/core/types.ts`)

```ts
type Face = 'H' | 'T'
type CoinEffectId = 'weight' | 'doubleSide' | 'chaos' | 'echo' | 'magnetic' | 'reverse' | 'tax' | 'jackpot' | 'draw1' | 'draw2' | 'draw3'
interface Coin { id: number; effects: CoinEffectId[]; param?: Face }  // param: rolled favored face for weight/doubleSide (set on purchase)
interface Slot { coin: Coin; face: Face; echoUsed: boolean }         // one tossed coin in a play slot
type Hand = (Coin | null)[]                                          // length = handSize (base 8); face-down coins drawn this hand
type Play = (Slot | null)[]                                          // length 5; the picked coins (1–5), tossed in the toss phase; null = empty slot (counts as nothing — no wilds)
type TierId = 'jackpot' | 'fourRow' | 'alternating' | 'fourSame' | 'tripleRun' | 'threeSame'
type BlindKind = 'small' | 'big' | 'boss'
type Phase = 'menu' | 'run' | 'shop' | 'runEnd'
type HandPhase = 'draw' | 'play' | 'toss' | 'buff' | 'score'         // per-hand phase flow (Q&A 2026-09-14, round 3)
type BossRuleId = 'noAlternating' | 'shortFuse' | 'noJackpots' | 'heavyTarget'
type CharmId = 'plusChips' | 'plusMult' | 'extraHand' | 'payday' | 'jackpotFever'
type CharmCategory = 'flip' | 'scoring' | 'pattern' | 'economy'
type ShopOffer = { kind: 'charm'; charm: CharmId } | { kind: 'coin'; effect: CoinEffectId } | { kind: 'handSize' }

interface Tier { id: TierId; name: string; chips: number; mult: number }
interface Blind { round: number; kind: BlindKind; target: number; reward: number; boss?: BossRuleId }
interface CharmDef { id: CharmId; name: string; category: CharmCategory; price: number }
interface CoinDef { effect: CoinEffectId; name: string; price: number }   // v1 core set (9 + 3 draw tiers)
interface Deck { drawPile: Coin[]; discardPile: Coin[] }                  // collection = drawPile + discardPile
interface Score { tier: TierId; chips: number; mult: number; total: number; cash: number }  // cash: coin cash effects (Tax/Jackpot)
```

## Run State (zustand store shape)

```ts
interface RunState {
  seed: string
  phase: Phase
  round: number              // 1..4
  blindIndex: number         // 0..11 into the 12-blind table
  hand: Hand                 // handSize slots (base 8); face-down; null = empty (nothing)
  play: Play                 // 5 slots; the picked coins, tossed in the toss phase
  handPhase: HandPhase       // draw → play → toss → buff → score
  handSize: number           // 8 base; +1 per shop hand-size upgrade
  handsLeft: number          // 10 (8 on Short Fuse; +1 with Extra Hand)
  blindScore: number         // score accumulated in the current blind
  cash: number               // starts at $4
  charms: CharmId[]          // owned charms, in charm-bar (scoring) order
  deck: Deck                 // coin collection: drawPile (finite per blind) + discardPile (per blind)
  shop: { offers: ShopOffer[]; rerollUsed: boolean }
  lastScore: Score | null    // for the UI ticker
  runScore: number           // total score across the run (summary)
  won: boolean               // set when blind 12 is cleared
  rngState: number[]         // serialized RNG state (xoroshiro128+: 4 × int32)
}
```

## RNG Contract

- `createRng(seed)`: seed string (6–8 chars) → `xmur3` hash (vendored in `core/rng.ts` — pure-rand ships no string hash in any version) → `xoroshiro128plus` state (pure-rand; the library's recommended generator — no xoshiro256 export exists).
- **Draw-order contract** — the rng is drawn in this fixed order; it is part of the reproducibility guarantee (pinned by tests):
  1. **Blind start** — reshuffle the whole coin collection into the draw pile (Fisher–Yates with the rng); discard pile cleared
  2. **Per-hand draw** — pop up to `handSize` coins from the draw pile (no rng; the shuffle supplies the randomness)
  3. **Per play-phase discard** — draw-enchant redraws: pop N coins from the draw pile (no rng); coins enter the hand face-down
  4. **Per-slot toss** — face rolls in fixed order: odds roll (base 50/50, Weight 75/25, Magnetic 75/25, or Chaos's random-odds roll + face roll); then Echo re-flips in the buff phase (same rolls, once per Echo coin, player-timed)
  5. **Per-hand score** — one chance roll per Jackpot coin in the play (25%); Tax pays flat (no roll)
  6. **Shop** — shuffle the remaining offer pool with the rng, take up to 5; on shop open and on each reroll; plus one roll per purchased Weight (favored face) / Double-Side (face) coin

  Same seed + same player choices → identical run (charter objective 3).

## Persistence (localStorage)

- Key: `fifty-fifty-run` — single save slot; `save()` overwrites. No autosave.
- Shape: `{ version: 2, state: RunState }` — `version` for future migrations (v1 saves predate the coin collection; not migratable, discarded).
- **Resume semantics** (start of current blind, Q&A 2026-09-12):
  - Saved in `run`: `handsLeft` and `blindScore` reset to the blind's initial values; the deck is re-reshuffled from the collection (discard pile cleared); phase → `run`.
  - Saved in `shop`: resume at the shop — offers regenerated identically from `rngState`.
  - Preserved across resume: seed, round/blind, cash, charms + order, coin collection, rngState, runScore.
  - Reset across resume: hand, play, handsLeft, blindScore, handPhase, lastScore, draw/discard piles (re-reshuffled).

## Balance Data (`src/core/balance.ts`)

Data-only tables (draft values from [balance-baseline](../prm/plan/plan_balance-baseline.md) — tunable in playtest, not a scope change):

- `TIERS: Tier[6]` — Jackpot 50×4 · 4-in-a-row 40×3 · Alternating 35×3 · 4-same 30×2 · Triple-run 20×2 · 3-same 15×1 (EV/hand 58.44 for a full plain 5-coin play without discard)
- `BLINDS: Blind[12]` — 4 rounds × small/big/boss; targets 300 → 3500 (Heavy Target ×1.5 applied at runtime → 5250); rewards $4/$6/$10
- `BOSS_RULES: BossRule[4]` — No Alternating · Short Fuse · No Jackpots · Heavy Target (target ×1.5, +$5)
- `CHARMS: CharmDef[5]` — pool with categories and prices (Re-Toss removed 2026-09-13)
- `COIN_EFFECTS: CoinDef[11]` — v1 core set: Weight · Double-Side · Chaos · Echo · Magnetic · Reverse · Tax · Jackpot · Draw-1 · Draw-2 · Draw-3 (prices in balance-baseline)
- Constants: `HANDS_PER_BLIND = 10` · `SHORT_FUSE_HANDS = 8` · `HAND_SIZE = 8` · `PLAY_SIZE = 5` · `HAND_SIZE_UPGRADE_PRICE = 10` (draft) · `HAND_SIZE_CAP = 10` (draft) · `START_CASH = 4` · `SHOP_SLOTS = 5` · `FREE_REROLLS = 1` · `PAYDAY_BONUS = 5` · `HEAVY_TARGET_BONUS = 5` · `BASE_DECK_SIZE = 80` (re-tuned 2026-09-14, no-wilds calculation — see balance-baseline Deck Size Calculation) · `REMOVE_COIN_COST = 1` · `TAX_PAYOUT = 1` · `JACKPOT_CHANCE = 0.25` · `JACKPOT_PAYOUT = 4`

## Data Flow Summary

```
seed ─→ rng (start)
rng ─→ collection reshuffle (blind start) · face rolls (toss / echo re-flip) · jackpot chance rolls · shop offers + coin purchase rolls
balance tables + charms + coin effects + boss rule ─→ score (per hand: chips×mult + coin cash)
score ─→ blindScore ─→ win/lose ─→ reward ─→ cash ─→ shop ─→ charms + coins ─┐
                                                                       └─→ (back to scoring)
state ─→ localStorage (manual save) ─→ resume
```
