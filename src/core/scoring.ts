import {
  JACKPOT_CHANCE,
  JACKPOT_PAYOUT,
  MAGNETIC_ODDS,
  TAX_PAYOUT,
  TIERS,
  WEIGHT_ODDS,
} from './balance'
import type { Rng } from './rng'
import type { Coin, Face, Hand, Score, Slot, TierId } from './types'

/**
 * Pipeline step 1: resolve a coin's face through its effects.
 * Odds stage (priority): Magnetic (75% toward the left neighbor, if present)
 * > Double-Side (100/0 toward `param`) > Chaos (random 0–100) > Weight
 * (75/25 toward `param`) > base (50/50); then roll, then Reverse inverts.
 * Echo is player-timed: call again (once) to re-flip.
 *
 * rng draws: one for the face roll, plus one more when Chaos is active
 * (its random-odds roll).
 */
export function resolveFace(rng: Rng, coin: Coin, leftFace: Face | null): Face {
  let favored: Face = 'H'
  let odds: number
  if (coin.effects.includes('magnetic') && leftFace !== null) {
    favored = leftFace
    odds = MAGNETIC_ODDS
  } else if (coin.effects.includes('doubleSide')) {
    favored = coin.param ?? 'H'
    odds = 1
  } else if (coin.effects.includes('chaos')) {
    favored = 'H'
    odds = rng.next()
  } else if (coin.effects.includes('weight')) {
    favored = coin.param ?? 'H'
    odds = WEIGHT_ODDS
  } else {
    odds = 0.5
  }
  let face: Face = rng.next() < odds ? favored : favored === 'H' ? 'T' : 'H'
  if (coin.effects.includes('reverse')) face = face === 'H' ? 'T' : 'H'
  return face
}

/**
 * Pipeline step 4: the highest-value tier the hand matches. Empty slots
 * count as NOTHING (Q&A round 4, 2026-09-14) — no wilds: the pattern is
 * evaluated on the tossed coins only, in left-to-right slot order. A k-coin
 * play can only match tiers whose structure fits in k coins (4-in-a-row /
 * 4-same need 4+, alternating needs exactly 5, triple-run / 3-same need 3+);
 * a play of ≤2 coins matches no tier. null when no tier matches.
 */
export function matchTier(hand: Hand): TierId | null {
  const faces = hand.filter((s): s is Slot => s !== null).map((s) => s.face)
  if (faces.length < 3) return null
  return detectTier(faces)
}

/**
 * The highest-value tier a face sequence matches (TIERS priority order),
 * for any length 3–5 (see matchTier). A full 5-face hand always matches at
 * least one tier (3-same is the floor). null when no tier fits the length
 * (e.g. a 2-coin play).
 */
export function detectTier(hand: Face[]): TierId | null {
  if (hand.length < 3) return null
  const heads = hand.filter((f) => f === 'H').length
  const tails = hand.length - heads
  const maxRun = longestRun(hand)
  if (hand.length === 5 && (heads === 5 || tails === 5)) return 'jackpot'
  if (maxRun >= 4) return 'fourRow'
  if (hand.length === 5 && isAlternating(hand)) return 'alternating'
  if (heads === 4 || tails === 4) return 'fourSame'
  if (maxRun >= 3) return 'tripleRun'
  if (heads === 3 || tails === 3) return 'threeSame'
  return null
}

/** Pipeline steps 5–8: tier → base → total + coin cash (Tax flat, Jackpot chance). */
export function scoreHand(hand: Hand, rng: Rng): Score {
  const tier = matchTier(hand)
  let chips = 0
  let mult = 0
  if (tier !== null) {
    const def = TIERS.find((t) => t.id === tier)!
    chips = def.chips
    mult = def.mult
  }
  let cash = 0
  for (const slot of hand) {
    if (slot === null) continue
    if (slot.coin.effects.includes('tax')) cash += TAX_PAYOUT
    if (slot.coin.effects.includes('jackpot') && rng.next() < JACKPOT_CHANCE) {
      cash += JACKPOT_PAYOUT
    }
  }
  return { tier, chips, mult, total: chips * mult, cash }
}



function longestRun(hand: Face[]): number {
  let best = 1
  let run = 1
  for (let i = 1; i < hand.length; i++) {
    run = hand[i] === hand[i - 1] ? run + 1 : 1
    if (run > best) best = run
  }
  return best
}

function isAlternating(hand: Face[]): boolean {
  const s = hand.join('')
  return s === 'HTHTH' || s === 'THTHT'
}
