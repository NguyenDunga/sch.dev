// Toss coin (12.5) — the 3D coin that flies up, tumbles, and settles on the
// resolved face (SDD UX §4). Built with CSS 3D transforms (NOT r3f/rapier —
// see the M12.5 deviation note): CSS is inherently flat + unlit, so it
// upholds "never reads as realistic" with zero WebGL, no WASM, no peer
// conflict, and a jsdom-testable path.
//
// The outcome is never animation-derived — the face is already resolved in
// the store (confirmPlay). The animation only provides the arc + tumble +
// settle feel (700–900ms, staggered left→right).
//
// Reduced motion (UX §4/§8): a 2D cross-fade of the face (~160ms), no arc,
// no tumble, no 3D — same landing face.

import { motion, useReducedMotion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { CoinBadges } from './coin-badges'
import { FaceBadge } from './coin-disc'

/** Per-coin toss duration (ms). */
const TOSS_MS = 700
/** Stagger between coins (ms) so the toss reads left→right. */
const STAGGER_MS = 50
/** The tumble finishes exactly when the coin first lands (0.6 × 700ms). */
const TUMBLE_MS = 420
/** Two full spins, then the face offset (H=0°, T=180°). */
const SPINS = 720

interface TossCoinProps {
  face: Face
  index: number
  effects: CoinEffect[]
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
 * (translateY), tumbles (rotateX, 2 spins + face offset), and settles on the
 * resolved face. `transform-style: preserve-3d` + `backface-visibility` make
 * it read as a flipping coin (thin line when edge-on).
 */
export function TossCoin({ face, index, effects }: TossCoinProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <CrossfadeCoin face={face} effects={effects} />

  const finalRotate = SPINS + (face === 'T' ? 180 : 0)
  const delay = (index * STAGGER_MS) / 1000
  const label = face === 'H' ? 'heads' : 'tails'

  return (
    <div className="toss-coin">
      <motion.div
        className="toss-coin-flip"
        initial={{ y: 0, rotateX: 0 }}
        animate={{
          y: [0, -64, 0, -12, 0],
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
