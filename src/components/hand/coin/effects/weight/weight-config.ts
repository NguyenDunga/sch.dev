// Weight effect config — full config (values + meta + logic).
//
// Weight: 75% chance of the favored face. Visually tilts the coin toward
// the favored side.

import type { Face, CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

/** Effect metadata. */
export const WEIGHT_META = {
  kind: 'weight' as const,
  name: 'Weight',
  description: '75% chance of the favored face',
  priority: 2,
}

/** Visual values. */
export const WEIGHT_VALUES = {
  /** Tilt toward favored side (degrees). */
  tiltFavored: 12,
  /** Tilt away from favored side (degrees). */
  tiltOpposite: -4,
  /** Color tint when face matches favored. */
  colorFavored: 'color-mix(in srgb, var(--heads) 30%, var(--surface))',
}

/** The effect type (narrowed). */
export type WeightEffect = Extract<CoinEffect, { kind: 'weight' }>

/** Resolve the weight effect into a visual modifier. */
export function resolveWeight(effect: WeightEffect, face: Face): CoinVisualModifier {
  const direction = effect.favored === 'H' ? 1 : -1
  if (face === effect.favored) {
    return {
      tilt: direction * WEIGHT_VALUES.tiltFavored,
      color: WEIGHT_VALUES.colorFavored,
    }
  }
  return { tilt: direction * WEIGHT_VALUES.tiltOpposite }
}
