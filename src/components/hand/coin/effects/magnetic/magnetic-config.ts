// Magnetic effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const MAGNETIC_META = {
  kind: 'magnetic' as const,
  name: 'Magnetic',
  description: 'Thick solid border, slight scale up',
  priority: 6,
}

export const MAGNETIC_VALUES = {
  border: '3px solid var(--ink)',
  scale: 1.05,
}

export type MagneticEffect = Extract<CoinEffect, { kind: 'magnetic' }>

export function resolveMagnetic(): CoinVisualModifier {
  return { border: MAGNETIC_VALUES.border, scale: MAGNETIC_VALUES.scale }
}
