// C3 — Face resolution (M7): odds stage → roll → Reverse.
//
// Odds-stage priority (highest effect present wins):
//   magnetic (75% toward the left neighbour's face; no bias if left is empty,
//   in which case the next priority applies) > heads/tails (100/0 fixed face)
//   > chaos (uniform random 0–100% odds) > weight (75/25 toward its favoured
//   face) > base (50/50). Face-down is visual-only (no odds-stage entry).
// Then the face is rolled against the odds, and Reverse inverts it.
// Echo re-flip (buff phase) = the store calls this again.

import type { Rng } from '../rng'
import { COIN_EFFECTS } from '@/config/coins'
import type { Coin, CoinEffectKind, Face, Option } from '../types'

const opposite = (f: Face): Face => (f === 'H' ? 'T' : 'H')

// Face-effect odds — from the coin configs (src/config/coins).
const WEIGHT_ODDS = COIN_EFFECTS.weight.params.odds ?? 0.5
const MAGNETIC_ODDS = COIN_EFFECTS.magnetic.params.odds ?? 0.5

/**
 * M7: face resolution — odds stage → roll → Reverse.
 */
export function resolveFace(rng: Rng, coin: Coin, left: Option<Face>): Face {
  const effect = (kind: CoinEffectKind) => coin.effects.find((e) => e.kind === kind)

  // Odds stage — the highest-priority odds effect present sets the odds.
  let target: Face
  let p: number
  const weight = effect('weight')
  if (left.some && effect('magnetic')) {
    target = left.value
    p = MAGNETIC_ODDS
  } else if (effect('heads')) {
    target = 'H'
    p = 1
  } else if (effect('tails')) {
    target = 'T'
    p = 1
  } else if (effect('chaos')) {
    target = 'H'
    p = rng.next() // uniform 0–100% odds, rolled fresh each flip
  } else if (weight && weight.kind === 'weight') {
    target = weight.favored
    p = WEIGHT_ODDS
  } else {
    target = 'H'
    p = 0.5
  }

  // Roll
  let face = rng.next() < p ? target : opposite(target)

  // Reverse inverts the result
  if (effect('reverse')) face = opposite(face)
  return face
}
