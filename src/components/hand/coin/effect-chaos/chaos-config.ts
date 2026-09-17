// Chaos effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const CHAOS_META = {
  kind: 'chaos' as const,
  name: 'Chaos',
  description: 'Randomizes the border style',
  priority: 4,
}

export const CHAOS_VALUES = {
  border: '3px dashed var(--ink-soft)',
  customClass: 'coin-face--chaos',
  /** Face-down back (one per effect; the face is hidden while face-down). */
  facedown: { border: '3px dashed var(--ink-soft)' },
}

export type ChaosEffect = Extract<CoinEffect, { kind: 'chaos' }>

export function resolveChaos(): CoinVisualModifier {
  return { border: CHAOS_VALUES.border, customClass: CHAOS_VALUES.customClass }
}
