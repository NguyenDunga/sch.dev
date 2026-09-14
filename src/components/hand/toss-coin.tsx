// Toss coin (12.5 + 12.6) — the 3D coin that flies up, tumbles, and settles
// on the resolved face (SDD UX §4). Built with CSS 3D transforms (NOT
// r3f/rapier — see the M12.5 deviation note): CSS is inherently flat + unlit,
// so it upholds "never reads as realistic" with zero WebGL, no WASM, and a
// jsdom-testable path.
//
// The outcome is never animation-derived — the face is already resolved in
// the store (confirmPlay / echoReflip). The animation only provides the arc +
// tumble + settle feel.
//
// Two modes:
//   - full toss (initial): arc + 2-spin tumble + bounce, 700ms, staggered
//     left→right (index * STAGGER_MS).
//   - quick re-flip (Echo, 12.6): a single full spin + small arc, ~400ms, no
//     stagger. The coin spins once and lands on the new face regardless of
//     its previous face (a clean re-toss).
//
// Reduced motion (UX §4/§8): a 2D cross-fade of the face (~160ms), no arc,
// no tumble, no 3D — same landing face.

import { motion, useReducedMotion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { CoinBadges } from './coin-badges'
import { FaceBadge } from './coin-disc'

/** Per-coin full-toss duration (ms). */
const TOSS_MS = 700
/** Stagger between coins on the initial toss (ms) — reads left→right. */
const STAGGER_MS = 50
/** The full-tumble finishes exactly when the coin first lands (0.6 × 700ms). */
const TUMBLE_MS = 420
/** Full toss: two spins. Quick re-flip: one spin. */
const FULL_SPINS = 720
const QUICK_SPINS = 360

interface TossCoinProps {
  face: Face
  /** Hand index — used for the initial-toss stagger only. */
  index: number
  effects: CoinEffect[]
  /** Quick single-axis re-flip (Echo) — shorter, no stagger. */
  quick?: boolean
}

/** The 2D cross-fade fallback (reduced motion): the face fades in, ~160ms. */
function CrossfadeCoin({ face, effects }: { face: Face; effects: CoinEffect[] }) {
  const label = face === 'H' ? 'heads' : 'tails'
  return (
    <div className="toss-coin toss-coin--2d">
      <motion.span
        className={`coin-disc coin-disc--${face.toLowerCase()}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.16 }}
        role="img"
        aria-label={label}
      >
        {face}
      </motion.span>
      <span className="coin-badges">
        <FaceBadge face={face} />
        <CoinBadges effects={effects} />
      </span>
    </div>
  )
}

/**
 * The 3D toss coin. A two-face disc (H front, T back) that arcs up
 * (translateY), tumbles (rotateX), and settles on the resolved face.
 * `transform-style: preserve-3d` + `backface-visibility` make it read as a
 * flipping coin (a thin line when edge-on).
 */
export function TossCoin({ face, index, effects, quick = false }: TossCoinProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <CrossfadeCoin face={face} effects={effects} />

  const faceOffset = face === 'T' ? 180 : 0
  const finalRotate = (quick ? QUICK_SPINS : FULL_SPINS) + faceOffset
  const delay = quick ? 0 : (index * STAGGER_MS) / 1000
  const apex = quick ? -32 : -64
  const label = face === 'H' ? 'heads' : 'tails'

  return (
    <div className="toss-coin">
      <motion.div
        className="toss-coin-flip"
        initial={{ y: 0, rotateX: 0 }}
        animate={{
          y: [0, apex, 0, apex / 5, 0],
          rotateX: [0, finalRotate],
        }}
        transition={{
          y: {
            duration: TOSS_MS / 1000,
            times: [0, 0.45, 0.6, 0.8, 1],
            delay,
            ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'],
          },
          rotateX: { duration: TUMBLE_MS / 1000, delay, ease: 'easeInOut' },
        }}
        style={{ transformStyle: 'preserve-3d' }}
        role="img"
        aria-label={label}
      >
        <div className="toss-face toss-face--heads">H</div>
        <div className="toss-face toss-face--tails">T</div>
      </motion.div>
      <span className="coin-badges">
        <FaceBadge face={face} />
        <CoinBadges effects={effects} />
      </span>
    </div>
  )
}
