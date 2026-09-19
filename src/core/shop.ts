// Shop data (13a.14) — shop-side pricing and the recycler's sell price.
// Data + pure pricing helpers (draft values from plan_balance-baseline.md —
// tunable in playtest). The charm/coin catalogs (names, prices, blurbs,
// icons, behavior params) live in the config registries:
// src/config/charms, src/config/coins.

import type { Coin } from './types'

/** Hand-size upgrade: price and cap (draft, 2026-09-13 Q&A round 3). */
export const HAND_SIZE_PRICE = 10
export const HAND_SIZE_CAP = 10
/** The number of offers in a shop (M9.1). */
export const SHOP_SLOTS = 5
/** 13a.15: unlimited rerolls — the next reroll costs $1 more than the
 *  previous one. The counter is per round: it persists across the shops of
 *  a round (small → big → boss) and resets after a boss blind. */
export function rerollCost(rerollsUsed: number): number {
  return rerollsUsed + 1
}
/** Forge (13a.14): the cost to merge two coins into one. */
export const FORGE_COST = 1
/** Recycler (13a.14): sell price per coin effect (a plain coin sells for the $1 minimum). */
export const RECYCLE_PRICE_PER_EFFECT = 1

/** Recycler: the sell price of a coin — $1 per effect, $1 minimum (a plain
 *  50/50 coin still sells for $1). */
export function recyclePrice(coin: Coin): number {
  return Math.max(1, coin.effects.length) * RECYCLE_PRICE_PER_EFFECT
}
