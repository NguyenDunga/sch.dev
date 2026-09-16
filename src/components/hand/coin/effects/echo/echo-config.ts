// Echo effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const ECHO_META = {
  kind: 'echo' as const,
  name: 'Echo',
  description: 'Glow pulse on the coin',
  priority: 5,
}

export const ECHO_VALUES = {
  glow: '0 0 12px 4px color-mix(in srgb, var(--secondary) 50%, transparent)',
  customClass: 'coin-face--echo',
}

export type EchoEffect = Extract<CoinEffect, { kind: 'echo' }>

export function resolveEcho(): CoinVisualModifier {
  return { glow: ECHO_VALUES.glow, customClass: ECHO_VALUES.customClass }
}
