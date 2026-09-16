// Tax effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const TAX_META = {
  kind: 'tax' as const,
  name: 'Tax',
  description: 'Dim + red tint, scale down',
  priority: 8,
}

export const TAX_VALUES = {
  color: 'color-mix(in srgb, var(--danger) 25%, var(--surface))',
  scale: 0.9,
  customClass: 'coin-face--tax',
}

export type TaxEffect = Extract<CoinEffect, { kind: 'tax' }>

export function resolveTax(): CoinVisualModifier {
  return { color: TAX_VALUES.color, scale: TAX_VALUES.scale, customClass: TAX_VALUES.customClass }
}
