import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'
import { resolveHeads, type HeadsEffect } from './heads-config'
export type { HeadsEffect } from './heads-config'
export function headsResolver(_effect: HeadsEffect, face: Face | undefined): CoinVisualModifier {
  return resolveHeads(face)
}
