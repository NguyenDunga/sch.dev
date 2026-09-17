// Weight effect resolver — delegates to the config's resolve function.
import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'
import { resolveWeight, type WeightEffect } from './weight-config'

export type { WeightEffect } from './weight-config'

export function weightResolver(effect: WeightEffect, face: Face | undefined): CoinVisualModifier {
  return resolveWeight(effect, face)
}
