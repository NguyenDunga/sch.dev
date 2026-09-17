// Reverse effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const REVERSE_META = {
  kind: 'reverse' as const,
  name: 'Reverse',
  description: 'Inverted hue (visual only)',
  priority: 7,
}

export const REVERSE_VALUES = {
  customClass: 'coin-face--reverse',
  /** Face-down back (one per effect; the face is hidden while face-down). */
  facedown: { color: 'color-mix(in srgb, var(--ink-soft) 20%, var(--surface-sunk))' },
}

export type ReverseEffect = Extract<CoinEffect, { kind: 'reverse' }>

export function resolveReverse(): CoinVisualModifier {
  return { customClass: REVERSE_VALUES.customClass }
}
