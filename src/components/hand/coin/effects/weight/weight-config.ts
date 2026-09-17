// Weight effect config — full config (values + meta + logic).
//
// Weight: 75% chance of the favored face. Visually tints the face when it
// matches the favored side.

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
  /** Color tint when face matches favored. */
  colorFavored: 'color-mix(in srgb, var(--heads) 30%, var(--surface))',
}

/** The effect type (narrowed). */
export type WeightEffect = Extract<CoinEffect, { kind: 'weight' }>

/** Resolve the weight effect into a visual modifier (face-up only). */
export function resolveWeight(effect: WeightEffect, face: Face | undefined): CoinVisualModifier {
  if (face === undefined) return {} // face-down: no face to tint
  if (face === effect.favored) return { color: WEIGHT_VALUES.colorFavored }
  return {}
}
