// Discard ghost (13.1) — the `discard` animation (UX §5): when a hand coin is
// discarded, the store removes it instantly (juice never gates/mutates state),
// so a fixed-position "ghost" of the coin flies from the tapped coin's spot
// to the discard well and fades out — 180ms, ease-out.
//
// Reduced motion (UX §8): no flight — a quick fade in place.
// The layer is pointer-events: none (never blocks input) and each ghost
// removes itself when its animation completes.

import { motion, useReducedMotion } from 'framer-motion'
import type { Coin } from '@/core/types'
import { DISCARD, EASING } from '@/lib/motion'
import { CoinBadges } from '@/components/hand/coin-badges'
import { CoinDisc } from '@/components/hand/coin-disc'

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

interface DiscardGhostLayerProps {
  ghosts: DiscardGhost[]
  onDone: (key: number) => void
}

/** The fixed overlay that plays every in-flight discard ghost. */
export function DiscardGhostLayer({ ghosts, onDone }: DiscardGhostLayerProps) {
  if (ghosts.length === 0) return null
  return (
    <div className="discard-ghost-layer" aria-hidden>
      {ghosts.map((g) => (
        <Ghost key={g.key} ghost={g} onDone={onDone} />
      ))}
    </div>
  )
}

function Ghost({ ghost, onDone }: { ghost: DiscardGhost; onDone: (key: number) => void }) {
  const reduceMotion = useReducedMotion()
  const { from, to } = ghost
  // End centered on the well: final top-left = well center − half the coin.
  const dx = to.x - from.w / 2 - from.x
  const dy = to.y - from.h / 2 - from.y

  return (
    <motion.div
      className="discard-ghost"
      style={{ left: from.x, top: from.y, width: from.w, height: from.h }}
      initial={reduceMotion ? { opacity: 1 } : { x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={reduceMotion ? { opacity: 0 } : { x: dx, y: dy, opacity: 0, scale: 0.5 }}
      transition={{ duration: reduceMotion ? 0.16 : DISCARD.duration, ease: EASING.out }}
      onAnimationComplete={() => onDone(ghost.key)}
    >
      <CoinDisc face={undefined} />
      <CoinBadges effects={ghost.coin.effects} />
    </motion.div>
  )
}
