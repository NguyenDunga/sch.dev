// Reverse effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const REVERSE_META = {
  kind: 'reverse' as const,
  name: 'Reverse',
  description: 'Inverts the tilt direction',
  priority: 7,
}

export const REVERSE_VALUES = {
  tilt: -8,
  customClass: 'coin-face--reverse',
}

export type ReverseEffect = Extract<CoinEffect, { kind: 'reverse' }>

export function resolveReverse(): CoinVisualModifier {
  return { tilt: REVERSE_VALUES.tilt, customClass: REVERSE_VALUES.customClass }
}
