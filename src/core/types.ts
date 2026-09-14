export type Face = 'H' | 'T'

/** v1 core coin effects (balance-baseline "Coin Effects", 2026-09-13 Q&A round 2). */
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

/**
 * One coin in the collection. `param` is the favored face rolled on purchase
 * for weight (75/25 lean) and doubleSide (100/0 fixed); unset for all others.
 */
export interface Coin {
  id: number
  effects: CoinEffectId[]
  param?: Face
}

/** One tossed coin in a hand slot. */
export interface Slot {
  coin: Coin
  face: Face
  /** Echo re-flip already used this hand. */
  echoUsed: boolean
}

/** 5 slots; null = empty slot (counts as nothing — no wilds, Q&A round 4). */
export type Hand = (Slot | null)[]

export type TierId = 'jackpot' | 'fourRow' | 'alternating' | 'fourSame' | 'tripleRun' | 'threeSame'
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

export interface Blind {
  round: number
  kind: BlindKind
  target: number
  reward: number
  boss?: BossRuleId
}

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

export interface Score {
  /** null = empty hand (deck depleted) — scores 0. */
  tier: TierId | null
  chips: number
  mult: number
  total: number
  /** Cash paid by coin cash effects (Tax/Jackpot), outside chips × mult. */
  cash: number
}
