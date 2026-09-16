// Double-Side effect config.
import type { Face, CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const DOUBLE_SIDE_META = {
  kind: 'doubleSide' as const,
  name: 'Double-Side',
  description: 'Always the favored face',
  priority: 3,
}

export const DOUBLE_SIDE_VALUES = {
  tiltFavored: 18,
  scaleOpposite: 0.95,
  colorFavored: 'var(--heads)',
  glowFavored: '0 0 8px 2px color-mix(in srgb, var(--heads) 40%, transparent)',
}

export type DoubleSideEffect = Extract<CoinEffect, { kind: 'doubleSide' }>

export function resolveDoubleSide(effect: DoubleSideEffect, face: Face): CoinVisualModifier {
  if (face === effect.favored) {
    return {
      tilt: (effect.favored === 'H' ? 1 : -1) * DOUBLE_SIDE_VALUES.tiltFavored,
      color: DOUBLE_SIDE_VALUES.colorFavored,
      glow: DOUBLE_SIDE_VALUES.glowFavored,
    }
  }
  return { tilt: 0, scale: DOUBLE_SIDE_VALUES.scaleOpposite }
}
