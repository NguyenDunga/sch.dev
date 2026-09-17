// Face-Down effect config.
//
// Face-Down: a hand-visual-only effect. While the coin is face-down (in hand,
// not yet tossed) it gets a special display — a brighter sunk fill + soft glow
// + dashed ring. No core change: the coin still resolves H/T on the toss.

import type { Face, CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const FACEDOWN_META = {
  kind: 'facedown' as const,
  name: 'Face-Down',
  description: 'Special face-down display in hand (no gameplay change)',
  priority: 1,
}

export const FACEDOWN_VALUES = {
  color: 'color-mix(in srgb, var(--surface-sunk) 65%, var(--ink-soft))',
  glow: '0 0 10px 3px color-mix(in srgb, var(--primary) 35%, transparent)',
  customClass: 'coin-face--facedown',
}

export type FacedownEffect = Extract<CoinEffect, { kind: 'facedown' }>

/** Resolve the face-down effect into a visual modifier (face-down only). */
export function resolveFacedown(face: Face | undefined): CoinVisualModifier {
  if (face === undefined) {
    return {
      color: FACEDOWN_VALUES.color,
      glow: FACEDOWN_VALUES.glow,
      customClass: FACEDOWN_VALUES.customClass,
    }
  }
  return {}
}
