// Draw effect config.
import type { CoinEffect } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'

export const DRAW_META = {
  kind: 'draw' as const,
  name: 'Draw',
  description: 'Tier-colored border based on draw count',
  priority: 10,
}

export const DRAW_VALUES: Record<string, { border: string; customClass: string }> = {
  '1': { border: '2px solid var(--tier-three-same)', customClass: 'coin-face--draw-1' },
  '2': { border: '2px solid var(--tier-triple-run)', customClass: 'coin-face--draw-2' },
  '3': { border: '2px solid var(--tier-jackpot)', customClass: 'coin-face--draw-3' },
}

/** Face-down back (one per effect; the face is hidden while face-down). */
export const DRAW_FACEDOWN_BACK: CoinVisualModifier = { border: '2px solid var(--ink-soft)' }

export type DrawEffect = Extract<CoinEffect, { kind: 'draw' }>

export function resolveDraw(effect: DrawEffect): CoinVisualModifier {
  const v = DRAW_VALUES[String(effect.count)] ?? { border: '2px solid var(--ink-soft)', customClass: 'coin-face--draw' }
  return { border: v.border, customClass: v.customClass }
}
