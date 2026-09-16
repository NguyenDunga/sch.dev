// Discard ghost (13.1) — pure logic: the in-flight discard's shape and its
// motion props. The `discard` animation (UX §5): when a hand coin is
// discarded, the store removes it instantly (juice never gates/mutates state),
// so a fixed-position "ghost" of the coin flies from the tapped coin's spot
// to the discard well and fades out — 180ms, ease-out.
//
// Reduced motion (UX §8): no flight — a quick fade in place (instant, same
// result). The component (DiscardGhostLayer) lives in discard-ghost.tsx.

import type { Coin } from '@/core/types'
import { DISCARD, EASING } from '@/lib/motion'

/** Viewport rect of the tapped coin (top-left + size). */
export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** One in-flight discard: the tapped coin's rect → the well's center. */
export interface DiscardGhost {
  key: number
  coin: Coin
  from: Rect
  to: { x: number; y: number }
}

/** The ghost's motion props (UX §8): reduced motion → a quick fade in place
 *  (no flight — instant, same result); otherwise → the flight to the well
 *  (180ms, ease-out) + fade. Pure + exported so the reduced-motion
 *  degradation is testable without running framer-motion in jsdom. */
export function ghostMotionProps(
  reduceMotion: boolean,
  from: Rect,
  to: { x: number; y: number },
): {
  initial: Record<string, number>
  animate: Record<string, number>
  transition: { duration: number; ease: readonly number[] }
} {
  // End centered on the well: final top-left = well center − half the coin.
  const dx = to.x - from.w / 2 - from.x
  const dy = to.y - from.h / 2 - from.y
  if (reduceMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 0 },
      transition: { duration: 0.16, ease: EASING.out },
    }
  }
  return {
    initial: { x: 0, y: 0, opacity: 1, scale: 1 },
    animate: { x: dx, y: dy, opacity: 0, scale: 0.5 },
    transition: { duration: DISCARD.duration, ease: EASING.out },
  }
}
