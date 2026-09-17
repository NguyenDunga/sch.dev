// Toss landing math (13.2) — pure helper for the toss coin: the final
// rotateX that lands the two-face disc on the store-resolved face. Kept in
// its own module so toss-coin.tsx only exports components (react-refresh)
// and the math is unit-testable without a DOM.

import type { Face } from '@/core/types'
import { TOSS } from '@/lib/motion'

/**
 * The final rotateX (deg) that lands the two-face disc on `face`: whole
 * spins + the face offset (H front = 0°, T back = 180°). This makes the
 * animation end on the store-resolved Slot.face (UX §0) — the outcome is
 * never animation-derived.
 */
export function settleRotation(face: Face, spins: number): number {
  return spins * 360 + (face === 'T' ? 180 : 0)
}

/** 13a.7 — when (seconds) the coin in slot `index` first lands: the toss
 *  arc's rise after the left→right stagger (13.2). Reduced motion (UX §8):
 *  a single 2D cross-fade — every coin lands together at 160ms. Drives the
 *  live projected score (the pattern emerges as the coins land). */
export function landDelay(index: number, reduced: boolean): number {
  return reduced ? 0.16 : index * TOSS.stagger + TOSS.rise
}
