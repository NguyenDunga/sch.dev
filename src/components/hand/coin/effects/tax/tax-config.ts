// Tax effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const TAX_META = {
  kind: 'tax' as const,
  name: 'Tax',
  description: 'Dim + red tint',
  priority: 8,
}

export const TAX_VALUES = {
  color: 'color-mix(in srgb, var(--danger) 25%, var(--surface))',
  customClass: 'coin-face--tax',
}

export type TaxEffect = Extract<CoinEffect, { kind: 'tax' }>

export function resolveTax(): CoinVisualModifier {
  return { color: TAX_VALUES.color, customClass: TAX_VALUES.customClass }
}
