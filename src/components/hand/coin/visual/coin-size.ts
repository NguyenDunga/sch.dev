// Coin size scale (13a.16): a semantic enum (xs → xl) that auto-adjusts to
// the user's device. Each size is a clamp between a min and max px, with the
// preferred size as a percentage of the viewport width — desktop gets the
// max, smaller screens shrink down to the min. The coin's internal geometry
// (glyph, ring, text) is numeric, so a named size resolves to px once
// (coinSizePx / useCoinSize) and the whole coin scales as one unit.

import { useSyncExternalStore } from 'react'

export const COIN_SIZES = {
  /** Tiny (the shop header deck icon). */
  xs: { min: 28, vw: 3.5, max: 40 },
  /** Small (deck piles, recycler rows). */
  sm: { min: 36, vw: 5, max: 48 },
  /** Medium (the deck panel, debug default). */
  md: { min: 48, vw: 7, max: 64 },
  /** Large (spare — between md and xl). */
  lg: { min: 60, vw: 8, max: 80 },
  /** Extra large (hand, play, toss, forge). */
  xl: { min: 72, vw: 9, max: 96 },
} as const

export type CoinSize = keyof typeof COIN_SIZES

/** The clamped px diameter for a size at a viewport width. */
export function coinSizePx(size: CoinSize, vw: number): number {
  const { min, vw: pct, max } = COIN_SIZES[size]
  return Math.round(Math.min(max, Math.max(min, (vw * pct) / 100)))
}

// One shared resize listener for every coin on screen (the coins subscribe
// via useSyncExternalStore; the snapshot is a pure function of lastVw, so it
// is stable between resizes).
let lastVw = typeof window !== 'undefined' ? window.innerWidth : 1280
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  window.addEventListener(
    'resize',
    () => {
      lastVw = window.innerWidth
      for (const l of listeners) l()
    },
    { passive: true },
  )
}

/** The clamped px diameter for a size, live (re-renders on viewport resize). */
export function useCoinSize(size: CoinSize): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => {
        listeners.delete(l)
      }
    },
    () => coinSizePx(size, lastVw),
  )
}
