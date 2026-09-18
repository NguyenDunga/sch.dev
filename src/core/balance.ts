import type { Blind, BossRuleId, Tier } from './types'

// Data-only tables (draft values from plan_balance-baseline.md — tunable in
// playtest, not a scope change). No logic here. Shop-side data (charm/coin
// catalog, shop pricing) lives in shop.ts.

/** One boss rule (shape of the BOSS_RULES table; the id also lives on the Blind 'boss' variant). */
export interface BossRule {
  id: BossRuleId
  name: string
  description: string
}

/** Global difficulty multiplier (beta v0.1.1): scales cash rewards, bonuses,
 *  and payouts (blind targets and tier chips/mults are unscaled). */
export const DIFFICULTY = 3;

export const HANDS_PER_BLIND = 4
/** Base hand size — coins drawn face-down per hand (8 base; +1 per shop hand-size upgrade). */
export const HAND_SIZE = 8
/** 13a.4: bonus paid per unused hand when a blind clears before its hand budget (draft +$1/hand). */
export const EARLY_CLEAR_BONUS_PER_HAND = 2 * DIFFICULTY;
/** Play slots — the player plays 1–5 coins per hand. */
export const PLAY_SIZE = 5
export const SHORT_FUSE_HANDS = 3
export const START_CASH = 4 * DIFFICULTY;
export const PAYDAY_BONUS = 5 * DIFFICULTY;
export const HEAVY_TARGET_BONUS = 5 * DIFFICULTY;
/** Heavy Target boss: the blind's table target is multiplied by this at runtime (1750 → 2625). */
export const HEAVY_TARGET_MULT = 1.5
/**
 * Base collection size (m13a, 2026-09-15 — plan_balance-baseline.md): a
 * small mixed deck. Keep-unplayed (13a.2) means only the played coins drain
 * the deck, so 4 hands × 8 draw-to-8 needs ≈23 draws — 24 covers it with a
 * 1-coin buffer. Hand-size upgrades can deck out on the last hand (accepted
 * cost — open decision resolved 2026-09-15: keep 24).
 */
export const BASE_DECK_SIZE = 24
/**
 * m13a: the starter collection is 16 plain 50/50 + 8 Weight coins. Each
 * starter Weight coin's favoured face is rolled at run start (50/50 Heads /
 * Tails, one rng draw per coin) — the lean is random, not fixed to Heads.
 */
export const STARTER_WEIGHT_COINS = 3 * DIFFICULTY;
/** Coin cash effects. */
export const TAX_PAYOUT = 1 * DIFFICULTY
export const JACKPOT_CHANCE = 0.25
export const JACKPOT_PAYOUT = 4
/** Scoring booster magnitudes (charm effects, applied left→right at score — SDD C3). */
export const PLUS_CHIPS_BONUS = 10
export const PLUS_MULT_BONUS = 1
export const JACKPOT_FEVER_MULT = 2
/** Face-effect odds (odds stage, balance-baseline). */
export const WEIGHT_ODDS = 0.75
export const MAGNETIC_ODDS = 0.75

export const BOSS_RULES: BossRule[] = [
  { id: 'noAlternating', name: 'No Alternating', description: 'Alternating hands score 0' },
  { id: 'shortFuse', name: 'Short Fuse', description: '3 hands instead of 4' },
  { id: 'noJackpots', name: 'No Jackpots', description: '5-same hands score as 4-same' },
  { id: 'heavyTarget', name: 'Heavy Target', description: `Target ×1.5, +$${HEAVY_TARGET_BONUS} bonus reward` },
]

export const TIERS: Tier[] = [
  { id: 'jackpot', name: 'Jackpot', chips: 50, mult: 4 },
  { id: 'fourRow', name: '4-in-a-row', chips: 40, mult: 3 },
  { id: 'alternating', name: 'Alternating', chips: 35, mult: 3 },
  { id: 'fourSame', name: '4-same', chips: 30, mult: 2 },
  { id: 'tripleRun', name: 'Triple-run', chips: 20, mult: 2 },
  { id: 'threeSame', name: '3-same', chips: 15, mult: 1 },
]

export const BLINDS: Blind[] = [
  // m13a (2026-09-15): targets halved from the 10-hand baseline — the
  // difficulty shape is unchanged (plan_balance-baseline.md).
  { round: 1, kind: 'small', target: 150, reward: 4 * DIFFICULTY },
  { round: 1, kind: 'big', target: 250, reward: 6 * DIFFICULTY },
  { round: 1, kind: 'boss', target: 400, reward: 10 * DIFFICULTY, rule: 'noAlternating' },
  { round: 2, kind: 'small', target: 300, reward: 4 * DIFFICULTY },
  { round: 2, kind: 'big', target: 500, reward: 6 * DIFFICULTY },
  { round: 2, kind: 'boss', target: 750, reward: 10 * DIFFICULTY, rule: 'shortFuse' },
  { round: 3, kind: 'small', target: 500, reward: 4 * DIFFICULTY },
  { round: 3, kind: 'big', target: 800, reward: 6 * DIFFICULTY },
  { round: 3, kind: 'boss', target: 1200, reward: 10 * DIFFICULTY, rule: 'noJackpots' },
  { round: 4, kind: 'small', target: 750, reward: 4 * DIFFICULTY },
  { round: 4, kind: 'big', target: 1200, reward: 6 * DIFFICULTY },
  { round: 4, kind: 'boss', target: 1750, reward: 10 * DIFFICULTY, rule: 'heavyTarget' },
]