// Shop data (13a.14) — the shop catalog and shop-side pricing, moved out of
// balance.ts so all shop-related data lives in one shop module. Data only
// (draft values from plan_balance-baseline.md — tunable in playtest).
//
// The run-side balance tables (tiers, blinds, boss rules, hand/deck sizing,
// coin cash effects, face odds) stay in balance.ts.

import type { CharmDef, CoinDef } from './types'

/** The charm catalog (shop offers + the charm bar's names). */
export const CHARMS: CharmDef[] = [
  { id: 'plusChips', name: '+Chips', category: 'scoring', price: 5 },
  { id: 'plusMult', name: '+Mult', category: 'scoring', price: 8 },
  { id: 'extraHand', name: 'Extra Hand', category: 'flip', price: 15 }, // 13a.11: $10 → $15 (playtest: +1 of 4 hands ≈ +5–9pp clear rate on mid blinds; the only charm that adds a full hand of EV)
  { id: 'payday', name: 'Payday', category: 'economy', price: 5 },
  { id: 'jackpotFever', name: 'Jackpot Fever', category: 'pattern', price: 12 },
]

/** The coin catalog (shop offers; 12 entries = 10 single-effect coins + Draw-1/2/3). */
export const COIN_EFFECTS: CoinDef[] = [
  { effect: 'weight', name: 'Weight', price: 5 },
  { effect: 'heads', name: 'Heads', price: 8 },
  { effect: 'tails', name: 'Tails', price: 8 },
  { effect: 'chaos', name: 'Chaos', price: 6 },
  { effect: 'echo', name: 'Echo', price: 7 },
  { effect: 'magnetic', name: 'Magnetic', price: 6 },
  { effect: 'reverse', name: 'Reverse', price: 5 },
  { effect: 'tax', name: 'Tax', price: 5 },
  { effect: 'jackpot', name: 'Jackpot', price: 10 },
  { effect: 'draw1', name: 'Draw-1', price: 5 },
  { effect: 'draw2', name: 'Draw-2', price: 8 },
  { effect: 'draw3', name: 'Draw-3', price: 12 },
]

/** Hand-size upgrade: price and cap (draft, 2026-09-13 Q&A round 3). */
export const HAND_SIZE_PRICE = 10
export const HAND_SIZE_CAP = 10
/** The number of offers in a shop (M9.1). */
export const SHOP_SLOTS = 5
/** Free rerolls per shop (M9.2 — the reroll is free, once). */
export const FREE_REROLLS = 1
/** Shop: delete a coin from the collection. */
export const REMOVE_COIN_COST = 1
/** Forge (13a.14 draft): the cost to merge two coins into one. */
export const FORGE_COST = 1
/** Recycler (13a.14 draft): sell price per coin effect (a plain coin sells for the $1 minimum). */
export const RECYCLE_PRICE_PER_EFFECT = 1
