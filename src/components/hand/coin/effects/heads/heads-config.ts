// Heads effect config.
//
// Heads: always lands on H (100/0). Visually emphasizes the H face with a
// lightened fill + heads glow when the coin is showing heads.

import type { Face, CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const HEADS_META = {
  kind: 'heads' as const,
  name: 'Heads',
  description: 'Always lands on Heads',
  priority: 3,
}

export const HEADS_VALUES = {
  colorFavored: 'color-mix(in srgb, var(--heads) 60%, white)',
  glowFavored: '0 0 10px 3px color-mix(in srgb, var(--heads) 50%, transparent)',
}

export type HeadsEffect = Extract<CoinEffect, { kind: 'heads' }>

/** Resolve the heads effect into a visual modifier (H face only). */
export function resolveHeads(face: Face | undefined): CoinVisualModifier {
  if (face === 'H') {
    return {
      color: HEADS_VALUES.colorFavored,
      glow: HEADS_VALUES.glowFavored,
    }
  }
  return {}
}
