// Jackpot effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const JACKPOT_META = {
  kind: 'jackpot' as const,
  name: 'Jackpot',
  description: 'Gold glow, gold border',
  priority: 9,
}

export const JACKPOT_VALUES = {
  color: 'color-mix(in srgb, var(--tier-jackpot) 40%, var(--surface))',
  glow: '0 0 16px 6px color-mix(in srgb, var(--tier-jackpot) 50%, transparent)',
  border: '3px solid var(--tier-jackpot)',
  customClass: 'coin-face--jackpot',
  /** Face-down back (one per effect; the face is hidden while face-down). */
  facedown: { glow: '0 0 10px 3px color-mix(in srgb, var(--tier-jackpot) 35%, transparent)', border: '2px solid var(--tier-jackpot)' },
}

export type JackpotEffect = Extract<CoinEffect, { kind: 'jackpot' }>

export function resolveJackpot(): CoinVisualModifier {
  return {
    color: JACKPOT_VALUES.color,
    glow: JACKPOT_VALUES.glow,
    border: JACKPOT_VALUES.border,
    customClass: JACKPOT_VALUES.customClass,
  }
}
