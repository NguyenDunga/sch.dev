// Toss coin (12.5 + 13.2) — the 3D coin that flies up, tumbles, and settles
// on the resolved face (SDD UX §4). Built with CSS 3D transforms (NOT
// r3f/rapier — see the M12.5 deviation note): CSS is inherently flat + unlit,
// so it upholds "never reads as realistic" with zero WebGL, no WASM, and a
// jsdom-testable path.
//
// The outcome is never animation-derived — the face is already resolved in
// the store (confirmPlay / echoReflip); the animation always lands on
// `Slot.face` (UX §0).
//
// Two modes (UX §5 table), both tuned to spring-bouncy (13.2):
//   - toss (initial): arc up + 2-spin tumble, 700–900ms, staggered
//     left→right (index * TOSS.stagger).
//   - echo (re-flip, 12.6): one spin + small arc, ~500ms, no stagger.
//
// The arc is two phases: a rise (ease-out), then a spring-bouncy settle —
// the spring's overshoot past the rest line IS the landing bounce (no baked
// keyframe bounce). The tumble is timed to finish exactly when the coin
// first lands.
//
// Reduced motion (UX §4/§8): a 2D cross-fade of the face (~160ms), no arc,
// no tumble, no 3D — same landing face.

import { useEffect, useRef } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { ECHO, EASING, SPRING, TOSS } from '@/lib/motion'
import { CoinBadges } from './coin-badges'
import { FaceBadge } from './coin-disc'
import { settleRotation } from './toss'
import { emitBurst } from '@/components/juice/particles'
import { playSfx } from '@/components/juice/sfx'

/** Full toss: two spins. Quick re-flip (Echo): one spin. */
const FULL_SPINS = 2
const QUICK_SPINS = 1

/** Arc apex (px above the rest line) per mode. */
const TOSS_APEX = -64
const ECHO_APEX = -32

/** Resolves after ms (the stagger delay before a coin's toss starts). */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** The 2D cross-fade fallback (reduced motion): the face fades in, ~160ms.
 *  The land sound still plays (reduced motion affects motion, not audio). */
function CrossfadeCoin({ face, effects }: { face: Face; effects: CoinEffect[] }) {
  useEffect(() => {
    playSfx('land', { rate: 1 + (Math.random() * 0.1 - 0.05) })
  }, [])
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

interface FlipCoinProps {
  face: Face
  /** Hand index — used for the initial-toss stagger only. */
  index: number
  effects: CoinEffect[]
  /** Quick single-axis re-flip (Echo) — shorter, no stagger. */
  quick: boolean
}

/**
 * The 3D toss coin (13.2). A two-face disc (H front, T back) that arcs up
 * (translateY, ease-out), tumbles (rotateX, timed to land with the coin),
 * and settles with spring-bouncy — the spring overshoot past 0 is the
 * landing bounce. `transform-style: preserve-3d` + `backface-visibility`
 * make it read as a flipping coin (a thin line when edge-on).
 */
/** 13.5 — the landing sparkle (UX §7: ~4 particles on land) at the coin's
 *  screen position. */
function landingSparkle(el: HTMLElement | null, face: Face): void {
  if (!el) return
  const r = el.getBoundingClientRect()
  emitBurst({
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
    color: face === 'H' ? 'var(--heads)' : 'var(--tails)',
    count: 4,
    speed: 0.55,
  })
}

function FlipCoin({ face, index, effects, quick }: FlipCoinProps) {
  const controls = useAnimation()
  const discRef = useRef<HTMLDivElement>(null)
  const rise = quick ? ECHO.rise : TOSS.rise
  const tumble = quick ? ECHO.tumble : TOSS.tumble
  const apex = quick ? ECHO_APEX : TOSS_APEX
  const delay = quick ? 0 : index * TOSS.stagger
  const finalRotate = settleRotation(face, quick ? QUICK_SPINS : FULL_SPINS)
  const label = face === 'H' ? 'heads' : 'tails'

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      await sleep(delay * 1000)
      if (cancelled) return
      // The tumble (parallel with the rise): the spin finishes exactly when
      // the coin first lands (rise + the spring's first zero-crossing).
      controls.start({ rotateX: finalRotate, transition: { duration: tumble, ease: 'easeInOut' } })
      // The arc: rise (ease-out), then the spring-bouncy settle — the
      // overshoot past 0 IS the landing bounce (UX §4/§5).
      await controls.start({ y: apex, transition: { duration: rise, ease: EASING.out } })
      if (cancelled) return
      landingSparkle(discRef.current, face) // the first landing
      // 13.7 — the land thud at a slightly different rate (UX §10: ±5%).
      playSfx('land', { rate: 1 + (Math.random() * 0.1 - 0.05) })
      controls.start({ y: 0, transition: SPRING.bouncy })
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [controls, apex, delay, finalRotate, rise, tumble, face])

  return (
    <div className="toss-coin" ref={discRef}>
      <motion.div
        className="toss-coin-flip"
        initial={{ y: 0, rotateX: 0 }}
        animate={controls}
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

interface TossCoinProps {
  face: Face
  /** Hand index — used for the initial-toss stagger only. */
  index: number
  effects: CoinEffect[]
  /** Quick single-axis re-flip (Echo) — shorter, no stagger. */
  quick?: boolean
}

export function TossCoin({ face, index, effects, quick = false }: TossCoinProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <CrossfadeCoin face={face} effects={effects} />
  return <FlipCoin face={face} index={index} effects={effects} quick={quick} />
}
