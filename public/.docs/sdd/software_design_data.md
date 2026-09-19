# Data Design: 50/50

Part of the [Software Architecture](software_design_architechture.md). Balance values: [Balance Baseline](../prm/plan/plan_balance-baseline.md).

## Core Types (`src/core/types.ts`)

**No-null policy (Rust mentality, 2026-09-14):** the model carries no `null` and no optional-as-absence field. Absence is an explicit `Option<T>`; every "either/or" is a tagged union, so illegal states (a Weight coin with no favoured face, a boss blind with no rule, a scored hand with a null tier) are unrepresentable.

```ts
type Face = 'H' | 'T'

// Rust's Option<T> — used instead of `null` for "maybe" values (neighbours, draws, last score).
type Option<T> = { some: true; value: T } | { some: false }

type DrawCount = 1 | 2 | 3

// Coin effects as a tagged union: each variant carries exactly its own data. A Weight/Double-Side
// coin always has a favoured face; a Chaos coin can never carry one. (Replaces the old
// `effects: CoinEffectId[]` + shared `faceParams?` — a merged coin just holds both variants.)
type CoinEffect =
  | { kind: 'weight'; favored: Face }
  | { kind: 'doubleSide'; favored: Face }
  | { kind: 'chaos' } | { kind: 'echo' } | { kind: 'magnetic' } | { kind: 'reverse' }
  | { kind: 'tax' } | { kind: 'jackpot' }
  | { kind: 'draw'; count: DrawCount }
type CoinEffectKind = CoinEffect['kind']

// Shop catalog id (Draw sold as 3 tiers). At purchase a Draw-N id → { kind: 'draw'; count: N },
// and Weight/Double-Side roll their favoured face into the effect variant.
type CoinEffectId = 'weight' | 'doubleSide' | 'chaos' | 'echo' | 'magnetic' | 'reverse' | 'tax' | 'jackpot' | 'draw1' | 'draw2' | 'draw3'

interface Coin { id: number; effects: CoinEffect[] }                   // effects carry their own params — no shared optional

interface FilledHandSlot { kind: 'filled'; coin: Coin; face: Face; echoUsed: boolean }  // one tossed coin
type HandSlot = { kind: 'empty' } | FilledHandSlot                     // an empty slot is an explicit variant, never null
type Hand = HandSlot[]                                                 // length = handSize (base 8); coins drawn this hand
type Play = HandSlot[]                                                 // length 5; the picked coins (1–5), tossed in the toss phase; empty slot counts as nothing (no wilds)
type TierId = 'jackpot' | 'fourRow' | 'alternating' | 'fourSame' | 'tripleRun' | 'threeSame'
type BlindKind = 'small' | 'big' | 'boss'
type Phase = 'menu' | 'run' | 'shop' | 'runEnd'
type HandPhase = 'draw' | 'play' | 'toss' | 'buff' | 'score'         // per-hand phase flow (Q&A 2026-09-14, round 3)
type BossRuleId = 'noAlternating' | 'shortFuse' | 'noJackpots' | 'heavyTarget'
type CharmId = 'plusChips' | 'plusMult' | 'extraHand' | 'payday' | 'jackpotFever'
type CharmCategory = 'flip' | 'scoring' | 'pattern' | 'economy'
type ShopOffer = { kind: 'charm'; charm: CharmId } | { kind: 'coin'; effect: CoinEffectId } | { kind: 'handSize' }

interface Tier { id: TierId; name: string; chips: number; mult: number }

// The boss rule lives inside the 'boss' variant — only a boss blind has a rule, and it always has one.
// No optional `boss?` field dangling on small/big blinds.
type Blind = { round: number; target: number; reward: number } & (
  | { kind: 'small' } | { kind: 'big' } | { kind: 'boss'; rule: BossRuleId }
)

interface CharmDef { id: CharmId; name: string; category: CharmCategory; price: number }
interface CoinDef { effect: CoinEffectId; name: string; price: number }   // 11 catalog entries = 8 single-effect coins + Draw-1/2/3 (9 effect types; Draw has 3 tiers)
interface Deck { drawPile: Coin[]; discardPile: Coin[] }                  // persistent collection == drawPile + discardPile (+ any coins currently in hand/play mid-blind)

// A hand's score: either no tier matched (scores 0, but may still earn coin cash) or a scored tier.
// No `tier: null` sentinel — a scored hand always has its numbers, a no-tier hand never carries stray ones.
type Score =
  | { kind: 'none'; cash: number }
  | { kind: 'scored'; tier: TierId; chips: number; mult: number; total: number; cash: number }  // cash: coin cash effects (Tax/Jackpot)
```

## Run State (zustand store shape)

```ts
interface RunState {
  seed: string
  phase: Phase
  round: number              // 1..4
  blindIndex: number         // 0..11 into the 12-blind table
  hand: Hand                 // handSize slots (base 8); empty slots are { kind: 'empty' } (nothing), never null
  play: Play                 // 5 slots; the picked coins, tossed in the toss phase
  handPhase: HandPhase       // draw → play → toss → buff → score
  handSize: number           // 8 base; +1 per shop hand-size upgrade
  handsLeft: number          // 4 (3 on Short Fuse; +1 with Extra Hand) — m13a 4-hand blinds
  blindScore: number         // score accumulated in the current blind
  cash: number               // starts at $4
  charms: CharmId[]          // owned charms, in charm-bar (scoring) order
  deck: Deck                 // coin collection: drawPile (finite per blind) + discardPile (per blind)
  shop: { offers: ShopOffer[]; rerollUsed: boolean }
  lastScore: Option<Score>   // for the UI ticker; none before the first hand is scored
  runScore: number           // total score across the run (summary)
  won: boolean               // set when blind 12 is cleared
  rngState: number[]         // serialized RNG state (xoroshiro128+: 4 × int32)
}
```

## RNG Contract

- `createRng(seed)`: seed string (6–8 chars) → `xmur3` hash (vendored in `core/rng.ts` — pure-rand ships no string hash in any version) → `xoroshiro128plus` state (pure-rand; the library's recommended generator — no xoshiro256 export exists).
- **Draw-order contract** — the rng is drawn in this fixed order; it is part of the reproducibility guarantee (pinned by tests):
  1. **Blind start** — reshuffle the whole coin collection into the draw pile (Fisher–Yates with the rng); discard pile cleared
  2. **Per-hand draw** — refill the hand up to `handSize` from the draw pile (no rng; the shuffle supplies the randomness); unplayed coins kept from the previous hand stay seated (m13a keep-unplayed)
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
  - **Determinism note (open design item):** resume re-reshuffles at blind start using the *current* `rngState`, which has already advanced past the original blind-start shuffle — so a resumed blind draws a **different** pile than the pre-save one, and "same seed + same choices → identical run" holds only for **uninterrupted** runs. This is intentional (resume = a clean blind restart) but lets a reload re-roll a blind. If save-scumming a blind should be prevented, snapshot the pre-shuffle `rngState` (or the shuffled pile) at blind start and restore *that* on resume. Not yet decided.

## Balance Data (`src/core/balance.ts`)

Data-only tables (current values: [balance-baseline](../prm/plan/plan_balance-baseline.md) — m13a redesign values, tunable in playtest, not a scope change):

- `TIERS: Tier[6]` — Jackpot 50×4 · 4-in-a-row 40×3 · Alternating 45×4 (near-jackpot, 180) · 4-same 30×2 · Triple-run 20×2 · 3-same 15×1 (EV/hand 63.13 for a full plain 5-coin play without discard — Alternating raised 35×3 → 45×4 in the 2026-09-16 balance pass; the tier table was unchanged by m13a, only the odds shift via the mixed deck)
- `BLINDS: Blind[12]` — 4 rounds × small/big/boss; targets **150 → 1750** (m13a: halved from the old 300 → 3500; Heavy Target ×1.5 applied at runtime → **2625**); rewards $4/$6/$10
- `BOSS_RULES: BossRule[4]` — No Alternating · Short Fuse · No Jackpots · Heavy Target (target ×1.5, +$5)
- `CHARMS: CharmDef[5]` — pool with categories and prices (Re-Toss removed 2026-09-13; Extra Hand re-priced $10 → $15 in m13a, 13a.11). *Config layout (M21):* each charm/coin owns one file under `src/config/` behind a compiler-complete registry — `CHARMS: Record<CharmId, CharmConfig>` / `COIN_EFFECTS: Record<CoinEffectKind, CoinEffectConfig>` (the Record key **is** the kind); `CHARM_CATALOG` / `COIN_CATALOG` are the derived `CharmDef[]` / `CoinDef[]` sold in the shop; `blurb(params)` is a function of the balance tables so displayed numbers can't drift.
- `COIN_EFFECTS: CoinDef[11]` — 9 effect types (Draw split into 3 tiers → 11 entries): Weight · Double-Side · Chaos · Echo · Magnetic · Reverse · Tax · Jackpot · Draw-1 · Draw-2 · Draw-3 (prices in balance-baseline)
- Constants: `HANDS_PER_BLIND = 4` (m13a, was 10) · `SHORT_FUSE_HANDS = 3` (m13a, was 8) · `HAND_SIZE = 8` · `PLAY_SIZE = 5` · `HAND_SIZE_UPGRADE_PRICE = 10` (draft) · `HAND_SIZE_CAP = 10` (draft) · `START_CASH = 4` · `SHOP_SLOTS = 5` · `FREE_REROLLS = 1` · `PAYDAY_BONUS = 5` · `HEAVY_TARGET_BONUS = 5` · `LEFTOVER_HAND_BONUS = 1` (m13a early clear: +$1 per unused hand, draft — 13a.4) · `BASE_DECK_SIZE = 24` (m13a, was 80 — see m13a recalc Deck-drain check) · starter composition (`buildCollection`): **16 plain + 8 Weight(Heads)** (m13a — aligned favored face; the recalc's headline finding) · `REMOVE_COIN_COST = 1` · `TAX_PAYOUT = 1` · `JACKPOT_CHANCE = 0.25` · `JACKPOT_PAYOUT = 4`

## Data Flow Summary

```
seed ─→ rng (start)
rng ─→ collection reshuffle (blind start) · face rolls (toss / echo re-flip) · jackpot chance rolls · shop offers + coin purchase rolls
balance tables + charms + coin effects + boss rule ─→ score (per hand: chips×mult + coin cash)
score ─→ blindScore ─→ win/lose (blind ends immediately when the target is met — leftover hands paid at LEFTOVER_HAND_BONUS, m13a) ─→ reward ─→ cash ─→ shop ─→ charms + coins ─┐
                                                                       └─→ (back to scoring)
state ─→ localStorage (manual save) ─→ resume

**Keep-unplayed (m13a):** after scoring, only the **played** coins leave to the discard pile; unplayed hand coins stay in the hand and the next hand refills up to `handSize` around them (deck drain ≈ played coins per hand — the recalc's ≈23 draws over 4 hands on a 24-deck).
```
