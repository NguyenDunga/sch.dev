// 13.5 — particle colors: CSS-token → canvas color resolution (SDD UX §7).
// Colors come from the active tier / theme tokens.

import type { TierId } from '@/core/types'

/** Reduced motion (UX §8): minimal particles (shorter, fewer). */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Hex fallbacks for the theme tokens (jsdom / no stylesheet). */
const TOKEN_HEX: Record<string, string> = {
  '--tier-jackpot': '#e8b04b',
  '--tier-four-row': '#8b6fc7',
  '--tier-alternating': '#2fa79b',
  '--tier-four-same': '#4a82c4',
  '--tier-triple-run': '#5aa469',
  '--tier-three-same': '#9a9086',
  '--heads': '#e8b04b',
  '--tails': '#6c8cb5',
  '--primary': '#f0654a',
}

/** Resolve a CSS var (or plain color) to a concrete color for the canvas. */
export function resolveColor(color: string): string {
  if (!color.startsWith('var(')) return color
  const name = color.slice(4, -1).trim()
  const live = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return live || TOKEN_HEX[name] || '#f0654a'
}

/** The active tier's color (UX §7: colors from the tier tokens). */
export function tierColor(tier: TierId): string {
  return resolveColor(`var(--tier-${tier === 'fourRow' ? 'four-row' : tier === 'threeSame' ? 'three-same' : tier === 'fourSame' ? 'four-same' : tier === 'tripleRun' ? 'triple-run' : tier})`)
}

/** The theme palette for confetti (tier tokens + primary). */
const CONFETTI_COLORS = [
  '--tier-jackpot',
  '--tier-four-row',
  '--tier-alternating',
  '--tier-four-same',
  '--tier-triple-run',
  '--primary',
]

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

/** Scale a burst's count + lifetime down under reduced motion (UX §8). */
export function scaleForReduced(count: number, ttl: number): { count: number; ttl: number } {
  return reducedMotion() ? { count: Math.max(2, Math.ceil(count * 0.3)), ttl: ttl * 0.6 } : { count, ttl }
}

/** The confetti palette, resolved to concrete colors. */
export function confettiColors(): string[] {
  return CONFETTI_COLORS.map(resolveColor)
}
