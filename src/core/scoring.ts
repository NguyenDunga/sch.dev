import {
  JACKPOT_CHANCE,
  JACKPOT_PAYOUT,
  MAGNETIC_ODDS,
  TAX_PAYOUT,
  TIERS,
  WEIGHT_ODDS,
} from './balance'
import type { Rng } from './rng'
import { isFilled, isSome, none, some } from './helpers'
import type { Coin, Face, Hand, Option, Score, TierId } from './types'

const opposite = (f: Face): Face => (f === 'H' ? 'T' : 'H')

/** The favoured face of a coin's Weight or Double-Side effect (both carry one). */
function favoredFace(coin: Coin, kind: 'weight' | 'doubleSide'): Face {
  const e = coin.effects.find(
    (x): x is Extract<Coin['effects'][number], { favored: Face }> => x.kind === kind,
  )
  return e ? e.favored : 'H'
}

const hasEffect = (coin: Coin, kind: Coin['effects'][number]['kind']): boolean =>
  coin.effects.some((e) => e.kind === kind)

/**
 * Pipeline step 1: resolve a coin's face through its effects.
 * Odds stage (priority): Magnetic (75% toward the left neighbour, if present)
 * > Double-Side (100/0 toward its favoured face) > Chaos (random 0–100) >
 * Weight (75/25 toward its favoured face) > base (50/50); then roll, then
 * Reverse inverts. Echo is player-timed: call again (once) to re-flip.
 *
 * `left` is the left neighbour's face as an Option — `none` at the left edge or
 * next to an empty slot, so Magnetic simply falls back to base odds.
 *
 * rng draws: one for the face roll, plus one more when Chaos is active
 * (its random-odds roll).
 */
export function resolveFace(rng: Rng, coin: Coin, left: Option<Face>): Face {
  let favored: Face = 'H'
  let odds: number
  if (hasEffect(coin, 'magnetic') && isSome(left)) {
    favored = left.value
    odds = MAGNETIC_ODDS
  } else if (hasEffect(coin, 'doubleSide')) {
    favored = favoredFace(coin, 'doubleSide')
    odds = 1
  } else if (hasEffect(coin, 'chaos')) {
    favored = 'H'
    odds = rng.next()
  } else if (hasEffect(coin, 'weight')) {
    favored = favoredFace(coin, 'weight')
    odds = WEIGHT_ODDS
  } else {
    odds = 0.5
  }
  let face: Face = rng.next() < odds ? favored : opposite(favored)
  if (hasEffect(coin, 'reverse')) face = opposite(face)
  return face
}

/**
 * Pipeline step 4: the highest-value tier the hand matches. Empty slots count
 * as NOTHING (Q&A round 4, 2026-09-14) — no wilds: the pattern is evaluated on
 * the tossed coins only, in left-to-right slot order. A k-coin play can only
 * match tiers whose structure fits in k coins (4-in-a-row / 4-same need 4+,
 * alternating needs exactly 5, triple-run / 3-same need 3+); a play of ≤2 coins
 * matches no tier (`none`).
 */
export function matchTier(hand: Hand): Option<TierId> {
  return detectTier(hand.filter(isFilled).map((s) => s.face))
}

/**
 * The highest-value tier a face sequence matches (TIERS priority order), for
 * any length 3–5 (see {@link matchTier}). A full 5-face hand always matches at
 * least one tier (3-same is the floor). `none` when no tier fits the length
 * (e.g. a 2-coin play).
 */
export function detectTier(faces: Face[]): Option<TierId> {
  if (faces.length < 3) return none
  const heads = faces.filter((f) => f === 'H').length
  const tails = faces.length - heads
  const maxRun = longestRun(faces)
  if (faces.length === 5 && (heads === 5 || tails === 5)) return some('jackpot')
  if (maxRun >= 4) return some('fourRow')
  if (faces.length === 5 && isAlternating(faces)) return some('alternating')
  if (heads === 4 || tails === 4) return some('fourSame')
  if (maxRun >= 3) return some('tripleRun')
  if (heads === 3 || tails === 3) return some('threeSame')
  return none
}

/** Pipeline steps 5–8: tier → base → total + coin cash (Tax flat, Jackpot chance). */
export function scoreHand(hand: Hand, rng: Rng): Score {
  const tier = matchTier(hand)
  let cash = 0
  for (const slot of hand) {
    if (!isFilled(slot)) continue
    for (const e of slot.coin.effects) {
      if (e.kind === 'tax') cash += TAX_PAYOUT
      if (e.kind === 'jackpot' && rng.next() < JACKPOT_CHANCE) cash += JACKPOT_PAYOUT
    }
  }
  if (!isSome(tier)) return { kind: 'none', cash }
  const def = TIERS.find((t) => t.id === tier.value)!
  return {
    kind: 'scored',
    tier: tier.value,
    chips: def.chips,
    mult: def.mult,
    total: def.chips * def.mult,
    cash,
  }
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
