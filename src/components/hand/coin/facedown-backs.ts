// The 2 canonical face-down backs — pre-display a *known* face (a hint, not the
// actual face; the face is still rolled at toss). Used by effects with a known
// face: Weight (by its favoured face), Heads (always H), Tails (always T).
//
// Face-down is a *state* (the face is hidden in hand), not an effect. These backs
// let a coin's back reveal the face it is biased toward / guaranteed to show:
//   - Weight-H → Facedown-Head (75% hint)
//   - Weight-T → Facedown-Tail (75% hint)
//   - Heads    → Facedown-Head (100% guarantee)
//   - Tails    → Facedown-Tail (100% guarantee)
// The effect glyph (scale / circle / circle-dot) still distinguishes the effects.

import type { CoinVisualModifier } from './coin-types'
import type { CoinEffect, Face } from '@/core/types'

/** The face-down back that pre-displays Heads (gold). */
export const FACEDOWN_HEAD_BACK: CoinVisualModifier = {
  color: 'color-mix(in srgb, var(--heads) 15%, var(--surface-sunk))',
  border: '2px solid color-mix(in srgb, var(--heads) 40%, var(--ink-soft))',
}

/** The face-down back that pre-displays Tails (slate). */
export const FACEDOWN_TAIL_BACK: CoinVisualModifier = {
  color: 'color-mix(in srgb, var(--tails) 15%, var(--surface-sunk))',
  border: '2px solid color-mix(in srgb, var(--tails) 40%, var(--ink-soft))',
}

/**
 * The first *known* face of a coin, or undefined. "Known" includes partially
 * known faces: Weight → its `favored` face (75%), Heads → 'H' (100%),
 * Tails → 'T' (100%). Used for face-down pre-display (e.g. a Magnetic coin
 * pre-displays its left neighbour's known face). The first known-face effect in
 * the list wins (Magnetic only reads the immediate left neighbour).
 */
export function knownFace(effects: CoinEffect[]): Face | undefined {
  for (const e of effects) {
    if (e.kind === 'weight') return e.favored
    if (e.kind === 'heads') return 'H'
    if (e.kind === 'tails') return 'T'
  }
  return undefined
}
