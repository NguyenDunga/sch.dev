import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'
import { resolveFacedown, type FacedownEffect } from './facedown-config'
export type { FacedownEffect } from './facedown-config'
export function facedownResolver(_effect: FacedownEffect, face: Face | undefined): CoinVisualModifier {
  return resolveFacedown(face)
}
