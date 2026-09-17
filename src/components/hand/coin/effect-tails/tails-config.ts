// Tails effect config.
//
// Tails: always lands on T (100/0). Visually emphasizes the T face with a
// lightened fill + tails glow when the coin is showing tails.

import type { Face, CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const TAILS_META = {
  kind: 'tails' as const,
  name: 'Tails',
  description: 'Always lands on Tails',
  priority: 3,
}

export const TAILS_VALUES = {
  colorFavored: 'color-mix(in srgb, var(--tails) 60%, white)',
  glowFavored: '0 0 10px 3px color-mix(in srgb, var(--tails) 50%, transparent)',
}

export type TailsEffect = Extract<CoinEffect, { kind: 'tails' }>

/** Resolve the tails effect into a visual modifier (T face only). */
export function resolveTails(face: Face | undefined): CoinVisualModifier {
  if (face === 'T') {
    return {
      color: TAILS_VALUES.colorFavored,
      glow: TAILS_VALUES.glowFavored,
    }
  }
  return {}
}
