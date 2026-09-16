// Jackpot effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../../coin-types'

export const JACKPOT_META = {
  kind: 'jackpot' as const,
  name: 'Jackpot',
  description: 'Gold glow, scale up, gold border',
  priority: 9,
}

export const JACKPOT_VALUES = {
  color: 'color-mix(in srgb, var(--tier-jackpot) 40%, var(--surface))',
  glow: '0 0 16px 6px color-mix(in srgb, var(--tier-jackpot) 50%, transparent)',
  scale: 1.1,
  border: '3px solid var(--tier-jackpot)',
  customClass: 'coin-face--jackpot',
}

export type JackpotEffect = Extract<CoinEffect, { kind: 'jackpot' }>

export function resolveJackpot(): CoinVisualModifier {
  return {
    color: JACKPOT_VALUES.color,
    glow: JACKPOT_VALUES.glow,
    scale: JACKPOT_VALUES.scale,
    border: JACKPOT_VALUES.border,
    customClass: JACKPOT_VALUES.customClass,
  }
}
