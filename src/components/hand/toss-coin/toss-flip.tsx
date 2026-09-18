// The 3D toss (motion allowed) — the two-face disc that arcs up (translateY,
// ease-out), tumbles (rotateX, timed to land with the coin), and settles with
// spring-bouncy — the spring overshoot past 0 is the landing bounce.
// `transform-style: preserve-3d` + `backface-visibility` make it read as a
// flipping coin (a thin line when edge-on).
//
// 13b.3: driven by a `useAnimate` timeline — the rise and the parallel tumble
// are declarative animations on the coin element, and the spring-bouncy
// settle chains off the rise's completion marker. The landing sparkle + land
// sfx fire from the rise's `finished` marker, not a setTimeout — the timing
// can't drift from the animation that produces it.

import { useEffect, useRef } from 'react'
import { useAnimate } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { ECHO, EASING, SPRING, TOSS } from '@/lib/motion'
import { CoinGlyph, CoinShell, resolveCoinFace } from '../coin'
import { useCoinSize } from '../coin/coin-size'
import { settleRotation } from './toss'
import { emitBurst } from '@/components/juice/particles'
import { playSfx } from '@/components/juice/sfx'

/** Full toss: two spins. Quick re-flip (Echo): one spin. */
const FULL_SPINS = 2
const QUICK_SPINS = 1

/** Arc apex (px above the rest line) per mode. */
const TOSS_APEX = -64
const ECHO_APEX = -32

/** One 3D face of the toss disc: the new coin's shell + glyph, resolved for
 *  that face (the resolver applies the effect modifiers — color, border,
 *  glow, custom classes — exactly like the flat coin). */
function TossFace({ face, effects, size }: { face: Face; effects: CoinEffect[]; size: number }) {
  const resolved = resolveCoinFace({ face, effects })
  return (
    <div className={`toss-face toss-face--${face === 'H' ? 'heads' : 'tails'}`}>
      <CoinShell
        color={resolved.color}
        border={resolved.border || undefined}
        glow={resolved.glow || undefined}
        customClasses={resolved.customClasses}
        size={size}
      >
        <div className="coin-glyph-layer">
          <CoinGlyph face={face} effects={effects} size={size - 14} />
        </div>
      </CoinShell>
    </div>
  )
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

interface FlipCoinProps {
  face: Face
  /** Hand index — used for the initial-toss stagger only. */
  index: number
  /** The coin's effects (the RadialReveal glyph on each face, M19). */
  effects: CoinEffect[]
  /** Quick single-axis re-flip (Echo) — shorter, no stagger. */
  quick: boolean
  /** 13b.8 — fired when the coin first lands (the rise completes), with the
   *  coin's slot index (a stable callback — the index is a prop, not a
   *  closure, so it never re-triggers the toss animation). */
  onLand?: (index: number) => void
}

export function FlipCoin({ face, index, effects, quick, onLand }: FlipCoinProps) {
  const flipRef = useRef<HTMLDivElement>(null)
  const discRef = useRef<HTMLDivElement>(null)
  const [, animate] = useAnimate()
  // 13a.16: the toss disc is the xl coin size (auto-adjusts to the viewport).
  const coinSize = useCoinSize('xl')
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
        {/* Each face carries the new coin's shell + RadialReveal glyph for
         *  its face stage (H front, T back). */}
        <TossFace face="H" effects={effects} size={coinSize} />
        <TossFace face="T" effects={effects} size={coinSize} />
      </div>
    </div>
  )
}
