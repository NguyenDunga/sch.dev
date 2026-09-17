import type { CoinVisualModifier } from '../coin-types'
import { resolveDraw, type DrawEffect } from './draw-config'
export type { DrawEffect } from './draw-config'
export function drawResolver(effect: DrawEffect): CoinVisualModifier {
  return resolveDraw(effect)
}
