import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'
import { resolveTails, type TailsEffect } from './tails-config'
export type { TailsEffect } from './tails-config'
export function tailsResolver(_effect: TailsEffect, face: Face | undefined): CoinVisualModifier {
  return resolveTails(face)
}
