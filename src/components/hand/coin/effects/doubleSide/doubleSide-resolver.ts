import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'
import { resolveDoubleSide, type DoubleSideEffect } from './doubleSide-config'
export type { DoubleSideEffect } from './doubleSide-config'
export function doubleSideResolver(effect: DoubleSideEffect, face: Face): CoinVisualModifier {
  return resolveDoubleSide(effect, face)
}
