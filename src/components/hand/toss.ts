// Toss landing math (13.2) — pure helper for the toss coin: the final
// rotateX that lands the two-face disc on the store-resolved face. Kept in
// its own module so toss-coin.tsx only exports components (react-refresh)
// and the math is unit-testable without a DOM.

import type { Face } from '@/core/types'

/**
 * The final rotateX (deg) that lands the two-face disc on `face`: whole
 * spins + the face offset (H front = 0°, T back = 180°). This makes the
 * animation end on the store-resolved Slot.face (UX §0) — the outcome is
 * never animation-derived.
 */
export function settleRotation(face: Face, spins: number): number {
  return spins * 360 + (face === 'T' ? 180 : 0)
}
