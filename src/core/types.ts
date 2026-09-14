export type Face = 'H' | 'T'

/**
 * A value that may be absent — the Rust `Option<T>`, used instead of `null` for
 * "maybe" results and neighbours. Absence is an explicit, checked state
 * (`{ some: false }`) rather than a `null` hiding inside a `T | null`.
 */
export type Option<T> = { some: true; value: T } | { some: false }
export const some = <T>(value: T): Option<T> => ({ some: true, value })
export const none: Option<never> = { some: false }
export const isSome = <T>(o: Option<T>): o is { some: true; value: T } => o.some

/** Draw-enchant tiers: redraw 1, 2, or 3 coins on discard. */
export type DrawCount = 1 | 2 | 3

/**
 * A coin effect as a tagged union: each variant carries exactly the data that
 * effect needs. A Weight/Double-Side coin always has a favoured face; a Chaos
 * coin can never carry one. Illegal states (a Weight coin with no face, a Chaos
 * coin with a stray param) are unrepresentable — the old shared `param?: Face`
 * is gone.
 */
export type CoinEffect =
  | { kind: 'weight'; favored: Face }
  | { kind: 'doubleSide'; favored: Face }
  | { kind: 'chaos' }
  | { kind: 'echo' }
  | { kind: 'magnetic' }
  | { kind: 'reverse' }
  | { kind: 'tax' }
  | { kind: 'jackpot' }
  | { kind: 'draw'; count: DrawCount }

/** The discriminant tags of {@link CoinEffect}. */
export type CoinEffectKind = CoinEffect['kind']

/**
 * Shop catalog id for a purchasable coin effect. Draw is sold as three tiers
 * (draw1/2/3); at purchase a Draw-N id becomes a `{ kind: 'draw'; count: N }`
 * effect and Weight/Double-Side roll their favoured face.
 */
export type CoinEffectId =
  | 'weight'
  | 'doubleSide'
  | 'chaos'
  | 'echo'
  | 'magnetic'
  | 'reverse'
  | 'tax'
  | 'jackpot'
  | 'draw1'
  | 'draw2'
  | 'draw3'

/** One coin in the collection. Each effect carries its own params — no shared optional. */
export interface Coin {
  id: number
  effects: CoinEffect[]
}

/** The data of a tossed coin occupying a hand slot. */
export interface FilledHandSlot {
  kind: 'filled'
  coin: Coin
  face: Face
  /** Echo re-flip already used this hand. */
  echoUsed: boolean
}

/**
 * One of the 5 hand slots: either empty (counts as nothing — no wilds, Q&A
 * round 4) or filled with a tossed coin. An explicit variant, never `null`.
 */
export type HandSlot = { kind: 'empty' } | FilledHandSlot

/** 5 slots, always length 5; an empty slot is `{ kind: 'empty' }`, never `null`. */
export type Hand = HandSlot[]

/** A fresh empty hand (5 empty slots), each a distinct object. */
export const emptyHand = (): Hand =>
  Array.from({ length: 5 }, (): HandSlot => ({ kind: 'empty' }))

/** Build a filled slot. */
export const filledSlot = (coin: Coin, face: Face, echoUsed = false): FilledHandSlot => ({
  kind: 'filled',
  coin,
  face,
  echoUsed,
})

/** Narrow a slot to its filled variant. */
export const isFilled = (slot: HandSlot): slot is FilledHandSlot => slot.kind === 'filled'

export type TierId =
  | 'jackpot'
  | 'fourRow'
  | 'alternating'
  | 'fourSame'
  | 'tripleRun'
  | 'threeSame'
export type BlindKind = 'small' | 'big' | 'boss'
export type Phase = 'menu' | 'run' | 'shop' | 'runEnd'
export type HandState = 'ready' | 'tossed'
export type BossRuleId = 'noAlternating' | 'shortFuse' | 'noJackpots' | 'heavyTarget'
export type CharmId = 'plusChips' | 'plusMult' | 'extraHand' | 'payday' | 'jackpotFever'
export type CharmCategory = 'flip' | 'scoring' | 'pattern' | 'economy'

export interface Tier {
  id: TierId
  name: string
  chips: number
  mult: number
}

/**
 * One blind. The boss rule lives inside the `'boss'` variant, so only a boss
 * blind has a rule — and a boss blind always has one. There is no optional
 * `boss?` field to leave dangling on a small/big blind.
 */
export type Blind = { round: number; target: number; reward: number } & (
  | { kind: 'small' }
  | { kind: 'big' }
  | { kind: 'boss'; rule: BossRuleId }
)

export interface BossRule {
  id: BossRuleId
  name: string
  description: string
}

export interface CharmDef {
  id: CharmId
  name: string
  category: CharmCategory
  price: number
}

export interface CoinDef {
  effect: CoinEffectId
  name: string
  price: number
}

export type ShopOffer =
  | { kind: 'charm'; charm: CharmId }
  | { kind: 'coin'; effect: CoinEffectId }

/**
 * Coin collection (SDD C11, Balatro-style 2026-09-13 Q&A round 2). The
 * collection (drawPile + discardPile) persists for the whole run; the draw
 * pile is finite within a blind (no reshuffle) and the discard pile is
 * cleared at each blind start.
 */
export interface Deck {
  drawPile: Coin[]
  discardPile: Coin[]
}

/**
 * A hand's score, as a tagged union. Either no tier matched (an empty or short
 * hand — scores 0, but may still earn coin cash) or a scored tier with its
 * chips/mult/total. No `tier: null` sentinel, so a scored hand always has its
 * numbers and a no-tier hand never carries stray ones.
 */
export type Score =
  | { kind: 'none'; cash: number }
  | { kind: 'scored'; tier: TierId; chips: number; mult: number; total: number; cash: number }

/** Points a score is worth (0 for a no-tier hand). */
export const scoreTotal = (score: Score): number => (score.kind === 'scored' ? score.total : 0)
