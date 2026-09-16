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
// 13b.3 — the toss is a single Motion timeline (useAnimate): the rise
// (ease-out) and the parallel tumble (timed to the first landing) run as
// declarative animations on the coin, and the spring-bouncy settle is chained
// off the rise's completion. The landing sparkle + land sfx fire from the
// rise's `finished` marker, not a setTimeout — the timing can't drift from
// the animation that produces it.
//
// Reduced motion (UX §4/§8): a 2D cross-fade of the face (~160ms), no arc,
// no tumble, no 3D — same landing face.

import { useEffect, useRef } from 'react'
import { motion, useAnimate, useReducedMotion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { DURATION, ECHO, EASING, SPRING, TOSS } from '@/lib/motion'
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

/** The 2D cross-fade fallback (reduced motion): the face fades in, ~160ms.
 *  The land sound still plays (reduced motion affects motion, not audio). */
function CrossfadeCoin({ face, effects, index, onLand }: { face: Face; effects: CoinEffect[]; index: number; onLand?: (index: number) => void }) {
  useEffect(() => {
    playSfx('land', { rate: 1 + (Math.random() * 0.1 - 0.05) })
    onLand?.(index)
  }, [onLand, index])
  const label = face === 'H' ? 'heads' : 'tails'
  return (
    <div className="toss-coin toss-coin--2d">
      <motion.span
        className={`coin-disc coin-disc--${face.toLowerCase()}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.quick / 1000 }}
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
  /** 13b.8 — fired when the coin first lands (the rise completes), with the
   *  coin's slot index (a stable callback — the index is a prop, not a
   *  closure, so it never re-triggers the toss animation). */
  onLand?: (index: number) => void
}

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

/**
 * The 3D toss coin (13.2). A two-face disc (H front, T back) that arcs up
 * (translateY, ease-out), tumbles (rotateX, timed to land with the coin),
 * and settles with spring-bouncy — the spring overshoot past 0 is the
 * landing bounce. `transform-style: preserve-3d` + `backface-visibility`
 * make it read as a flipping coin (a thin line when edge-on).
 *
 * 13b.3: driven by a `useAnimate` timeline — the rise and the parallel tumble
 * are declarative animations on the coin element, and the spring-bouncy
 * settle chains off the rise's completion marker.
 */
function FlipCoin({ face, index, effects, quick, onLand }: FlipCoinProps) {
  const flipRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const [, animate] = useAnimate()
  const rise = quick ? ECHO.rise : TOSS.rise
  const tumble = quick ? ECHO.tumble : TOSS.tumble
  const apex = quick ? ECHO_APEX : TOSS_APEX
  const delay = quick ? 0 : index * TOSS.stagger
  const finalRotate = settleRotation(face, quick ? QUICK_SPINS : FULL_SPINS)
  const label = face === 'H' ? 'heads' : 'tails'

  useEffect(() => {
    const el = flipRef.current
    if (!el) return
    // The arc: the rise (ease-out) and the parallel tumble — the spin
    // finishes exactly when the coin first lands (rise + the bouncy spring's
    // first zero-crossing). Both start after the left→right stagger delay.
    const riseAnim = animate(el, { y: apex }, { duration: rise, delay, ease: EASING.out })
    const tumbleAnim = animate(el, { rotateX: finalRotate }, { duration: tumble, delay, ease: 'easeInOut' })
    let settleAnim: { stop: () => void } | null = null
    let cancelled = false
    riseAnim.finished.then(() => {
      if (cancelled) return
      // The first landing (the timeline's completion marker): the sparkle +
      // the land thud fire here, not a setTimeout (13b.3).
      landingSparkle(discRef.current, face)
      // 13.7 — the land thud at a slightly different rate (UX §10: ±5%).
      playSfx('land', { rate: 1 + (Math.random() * 0.1 - 0.05) })
      onLand?.(index)
      // The spring-bouncy settle — the overshoot past 0 IS the landing bounce
      // (UX §4/§5). It begins at the first landing, overlapping the tail of
      // the tumble (as in the original).
      settleAnim = animate(el, { y: 0 }, SPRING.bouncy)
    })
    return () => {
      cancelled = true
      riseAnim.stop()
      tumbleAnim.stop()
      settleAnim?.stop()
    }
  }, [animate, apex, delay, finalRotate, rise, tumble, face, index, onLand])

  return (
    <div className="toss-coin" ref={discRef}>
      <div ref={flipRef} className="toss-coin-flip" style={{ transformStyle: 'preserve-3d' }} role="img" aria-label={label}>
        <div className="toss-face toss-face--heads">H</div>
        <div className="toss-face toss-face--tails">T</div>
      </div>
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
  /** 13b.8 — fired when the coin first lands (the rise completes), with the
   *  coin's slot index (a stable callback — the index is a prop, not a
   *  closure, so it never re-triggers the toss animation). */
  onLand?: (index: number) => void
}

export function TossCoin({ face, index, effects, quick = false, onLand }: TossCoinProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <CrossfadeCoin face={face} effects={effects} index={index} onLand={onLand} />
  return <FlipCoin face={face} index={index} effects={effects} quick={quick} onLand={onLand} />
}
