// Config types — the shape of a coin / charm config entry. Each coin lives in
// its own file under config/coins/ (same for charms under config/charms/);
// the registry (config/coins/index.ts, config/charms/index.ts) aggregates
// them into a compiler-enforced Record (every union member must be
// registered). Data only (M14: no RNG, no Date).

import type { CharmCategory, DrawCount, Face } from '@/core/types'
import type { EffectFaceConfig, FaceGlyph, IconDef } from '@/components/ui/icon'

/** Behavior params a coin effect can carry (the core reads these). */
export interface CoinEffectParams {
  odds?: number // weight / magnetic: probability of the target face
  payout?: number // tax: cash per scored play · jackpot: cash on a hit
  chance?: number // jackpot: probability of the payout
  tiers?: Partial<Record<DrawCount, number>> // draw: per-tier shop price
}

/** One coin effect — display, shop, and behavior in a single entry. */
export interface CoinEffectConfig {
  name: string
  /** Human blurb (parameterized from this entry's own params). */
  blurb: (p: CoinEffectParams) => string
  icon: IconDef // badge (popover / wiki / offer)
  face: EffectFaceConfig // per-face-stage glyph + color (H / T / face-down)
  params: CoinEffectParams // behavior (odds / payouts / draw tiers)
  price?: number // shop price (draw sells per tier — params.tiers)
  facedownByFavored?: Record<Face, FaceGlyph> // weight: face-down glyph by favoured face
}

/** Behavior params a charm can carry (the core reads these). */
export interface CharmParams {
  chips?: number // plusChips: chips added at score
  mult?: number // plusMult: mult added at score
  hands?: number // extraHand: hands added per blind
  bonus?: number // payday: bonus reward on a blind clear
  chipsMult?: number // jackpotFever: chips multiplier on a Jackpot hand
}

/** One charm — display, shop, and behavior in a single entry. */
export interface CharmConfig {
  name: string
  category: CharmCategory
  /** Human blurb (parameterized from this entry's own params). */
  blurb: (p: CharmParams) => string
  icon: IconDef
  params: CharmParams
  price: number
}
