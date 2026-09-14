import type { Blind, BossRuleId, CharmDef, CoinDef, Tier } from './types'

// Data-only tables (draft values from plan_balance-baseline.md — tunable in
// playtest, not a scope change). No logic here.

/** One boss rule (shape of the BOSS_RULES table; the id also lives on the Blind 'boss' variant). */
export interface BossRule {
  id: BossRuleId
  name: string
  description: string
}

export const TIERS: Tier[] = [
  { id: 'jackpot', name: 'Jackpot', chips: 50, mult: 4 },
  { id: 'fourRow', name: '4-in-a-row', chips: 40, mult: 3 },
  { id: 'alternating', name: 'Alternating', chips: 35, mult: 3 },
  { id: 'fourSame', name: '4-same', chips: 30, mult: 2 },
  { id: 'tripleRun', name: 'Triple-run', chips: 20, mult: 2 },
  { id: 'threeSame', name: '3-same', chips: 15, mult: 1 },
]

export const BLINDS: Blind[] = [
  { round: 1, kind: 'small', target: 300, reward: 4 },
  { round: 1, kind: 'big', target: 500, reward: 6 },
  { round: 1, kind: 'boss', target: 800, reward: 10, rule: 'noAlternating' },
  { round: 2, kind: 'small', target: 600, reward: 4 },
  { round: 2, kind: 'big', target: 1000, reward: 6 },
  { round: 2, kind: 'boss', target: 1500, reward: 10, rule: 'shortFuse' },
  { round: 3, kind: 'small', target: 1000, reward: 4 },
  { round: 3, kind: 'big', target: 1600, reward: 6 },
  { round: 3, kind: 'boss', target: 2400, reward: 10, rule: 'noJackpots' },
  { round: 4, kind: 'small', target: 1500, reward: 4 },
  { round: 4, kind: 'big', target: 2400, reward: 6 },
  { round: 4, kind: 'boss', target: 3500, reward: 10, rule: 'heavyTarget' },
]

export const BOSS_RULES: BossRule[] = [
  { id: 'noAlternating', name: 'No Alternating', description: 'Alternating hands score 0' },
  { id: 'shortFuse', name: 'Short Fuse', description: '8 hands instead of 10' },
  { id: 'noJackpots', name: 'No Jackpots', description: '5-same hands score as 4-same' },
  { id: 'heavyTarget', name: 'Heavy Target', description: 'Target ×1.5, +$5 bonus reward' },
]

/** Re-Toss removed 2026-09-13 (Q&A round 2) — unlimited discard supersedes it. */
export const CHARMS: CharmDef[] = [
  { id: 'plusChips', name: '+Chips', category: 'scoring', price: 5 },
  { id: 'plusMult', name: '+Mult', category: 'scoring', price: 8 },
  { id: 'extraHand', name: 'Extra Hand', category: 'flip', price: 10 },
  { id: 'payday', name: 'Payday', category: 'economy', price: 5 },
  { id: 'jackpotFever', name: 'Jackpot Fever', category: 'pattern', price: 12 },
]

/** v1 core coin effects (2026-09-13 Q&A round 2). Shop content lands in M3. */
export const COIN_EFFECTS: CoinDef[] = [
  { effect: 'weight', name: 'Weight', price: 5 },
  { effect: 'doubleSide', name: 'Double-Side', price: 8 },
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

export const HANDS_PER_BLIND = 10
/** Base hand size — coins drawn face-down per hand (8 base; +1 per shop hand-size upgrade). */
export const HAND_SIZE = 8
/** Hand-size upgrade: price and cap (draft, 2026-09-13 Q&A round 3). */
export const HAND_SIZE_PRICE = 10
export const HAND_SIZE_CAP = 10
/** Play slots — the player plays 1–5 coins per hand. */
export const PLAY_SIZE = 5
export const SHORT_FUSE_HANDS = 8
export const START_CASH = 4
export const SHOP_SLOTS = 5
export const FREE_REROLLS = 1
export const PAYDAY_BONUS = 5
export const HEAVY_TARGET_BONUS = 5
/**
 * Base collection size. Re-tuned 2026-09-14 (Q&A round 4, no-wilds
 * calculation — see plan_balance-baseline.md): 10 hands × 5 = 50 coins per
 * blind with buffer; empty slots count as nothing, so a full 5-coin play is
 * always the EV-optimal plain play.
 */
export const BASE_DECK_SIZE = 80
/** Shop: delete a coin from the collection. */
export const REMOVE_COIN_COST = 1
/** Coin cash effects. */
export const TAX_PAYOUT = 1
export const JACKPOT_CHANCE = 0.25
export const JACKPOT_PAYOUT = 4
/** Scoring booster magnitudes (charm effects, applied left→right at score — SDD C3). */
export const PLUS_CHIPS_BONUS = 10
export const PLUS_MULT_BONUS = 1
export const JACKPOT_FEVER_MULT = 2
/** Face-effect odds (odds stage, balance-baseline). */
export const WEIGHT_ODDS = 0.75
export const MAGNETIC_ODDS = 0.75
