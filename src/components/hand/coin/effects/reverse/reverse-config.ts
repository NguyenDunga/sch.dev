// Reverse effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const REVERSE_META = {
  kind: 'reverse' as const,
  name: 'Reverse',
  description: 'Inverted hue (visual only)',
  priority: 7,
}

export const REVERSE_VALUES = {
  customClass: 'coin-face--reverse',
}

export type ReverseEffect = Extract<CoinEffect, { kind: 'reverse' }>

export function resolveReverse(): CoinVisualModifier {
  return { customClass: REVERSE_VALUES.customClass }
}
