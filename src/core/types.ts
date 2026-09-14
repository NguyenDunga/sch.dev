// Core types for 50/50 — the SDD Data Design "Core Types" + "Run State"
// blocks, verbatim (source of truth: public/.docs/sdd/software_design_data.md).
// Types only: no runtime logic, no defaults (M1). Every later milestone
// imports from here; every shared shape is defined exactly once.

export type Face = 'H' | 'T'

// Rust's Option<T> — used instead of `null` for "maybe" values (neighbours, draws, last score).
export type Option<T> = { some: true; value: T } | { some: false }

export type DrawCount = 1 | 2 | 3

// Coin effects as a tagged union: each variant carries exactly its own data. A Weight/Double-Side
// coin always has a favoured face; a Chaos coin can never carry one. (Replaces the old
// `effects: CoinEffectId[]` + shared `faceParams?` — a merged coin just holds both variants.)
export type CoinEffect =
  | { kind: 'weight'; favored: Face }
  | { kind: 'doubleSide'; favored: Face }
  | { kind: 'chaos' } | { kind: 'echo' } | { kind: 'magnetic' } | { kind: 'reverse' }
  | { kind: 'tax' } | { kind: 'jackpot' }
  | { kind: 'draw'; count: DrawCount }
export type CoinEffectKind = CoinEffect['kind']

// Shop catalog id (Draw sold as 3 tiers). At purchase a Draw-N id → { kind: 'draw'; count: N },
// and Weight/Double-Side roll their favoured face into the effect variant.
export type CoinEffectId = 'weight' | 'doubleSide' | 'chaos' | 'echo' | 'magnetic' | 'reverse' | 'tax' | 'jackpot' | 'draw1' | 'draw2' | 'draw3'

export interface Coin { id: number; effects: CoinEffect[] }                   // effects carry their own params — no shared optional

export interface FilledHandSlot { kind: 'filled'; coin: Coin; face: Face; echoUsed: boolean }  // one tossed coin
export type HandSlot = { kind: 'empty' } | FilledHandSlot                     // an empty slot is an explicit variant, never null
export type Hand = HandSlot[]                                                 // length = handSize (base 8); coins drawn this hand
export type Play = HandSlot[]                                                 // length 5; the picked coins (1–5), tossed in the toss phase; empty slot counts as nothing (no wilds)
export type TierId = 'jackpot' | 'fourRow' | 'alternating' | 'fourSame' | 'tripleRun' | 'threeSame'
export type BlindKind = 'small' | 'big' | 'boss'
export type Phase = 'menu' | 'run' | 'shop' | 'runEnd'
export type HandPhase = 'draw' | 'play' | 'toss' | 'buff' | 'score'         // per-hand phase flow (Q&A 2026-09-14, round 3)
export type BossRuleId = 'noAlternating' | 'shortFuse' | 'noJackpots' | 'heavyTarget'
export type CharmId = 'plusChips' | 'plusMult' | 'extraHand' | 'payday' | 'jackpotFever'
export type CharmCategory = 'flip' | 'scoring' | 'pattern' | 'economy'
export type ShopOffer = { kind: 'charm'; charm: CharmId } | { kind: 'coin'; effect: CoinEffectId } | { kind: 'handSize' }

export interface Tier { id: TierId; name: string; chips: number; mult: number }

// The boss rule lives inside the 'boss' variant — only a boss blind has a rule, and it always has one.
// No optional `boss?` field dangling on small/big blinds.
export type Blind = { round: number; target: number; reward: number } & (
  | { kind: 'small' } | { kind: 'big' } | { kind: 'boss'; rule: BossRuleId }
)

export interface CharmDef { id: CharmId; name: string; category: CharmCategory; price: number }
export interface CoinDef { effect: CoinEffectId; name: string; price: number }   // 11 catalog entries = 8 single-effect coins + Draw-1/2/3 (9 effect types; Draw has 3 tiers)
export interface Deck { drawPile: Coin[]; discardPile: Coin[] }                  // persistent collection == drawPile + discardPile (+ any coins currently in hand/play mid-blind)

// A hand's score: either no tier matched (scores 0, but may still earn coin cash) or a scored tier.
// No `tier: null` sentinel — a scored hand always has its numbers, a no-tier hand never carries stray ones.
export type Score =
  | { kind: 'none'; cash: number }
  | { kind: 'scored'; tier: TierId; chips: number; mult: number; total: number; cash: number }  // cash: coin cash effects (Tax/Jackpot)

// Run State (zustand store shape) — the SDD Data Design "Run State" block, verbatim.
export interface RunState {
  seed: string
  phase: Phase
  round: number              // 1..4
  blindIndex: number         // 0..11 into the 12-blind table
  hand: Hand                 // handSize slots (base 8); empty slots are { kind: 'empty' } (nothing), never null
  play: Play                 // 5 slots; the picked coins, tossed in the toss phase
  handPhase: HandPhase       // draw → play → toss → buff → score
  handSize: number           // 8 base; +1 per shop hand-size upgrade
  handsLeft: number          // 10 (8 on Short Fuse; +1 with Extra Hand)
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
