// Magnetic effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const MAGNETIC_META = {
  kind: 'magnetic' as const,
  name: 'Magnetic',
  description: 'Thick solid border',
  priority: 6,
}

export const MAGNETIC_VALUES = {
  border: '3px solid var(--ink)',
  /** Face-down back (one per effect; the face is hidden while face-down). */
  facedown: { border: '3px solid var(--ink)' },
}

export type MagneticEffect = Extract<CoinEffect, { kind: 'magnetic' }>

export function resolveMagnetic(): CoinVisualModifier {
  return { border: MAGNETIC_VALUES.border }
}
