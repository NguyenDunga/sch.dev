// 13.3 — the `chips × mult = total` ticker row: the CountUp counters + the
// beat-driven build (chips tick on beat 3, the mult flares on beat 4, the
// total counts up on the resolve — beat 5, chips and mult slide together
// and collide). The row is remounted per run id (key) so each hand's
// counters start from zero.

import { useEffect } from 'react'
import type { RefObject } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { CHOREO, EASING } from '@/lib/motion'
import type { ChoroBeat } from './score-ticker'

/** A number that counts up when `active` turns true (0 → value).
 *  `instant` snaps to the value with no animation — a skip (UX §6: a skip
 *  snaps to the settled end) or the reduced-motion fast counters (UX §8). */
export function CountUp({
  value,
  active,
  duration,
  instant,
}: {
  value: number
  active: boolean
  duration: number
  instant: boolean
}) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString())
  useEffect(() => {
    if (instant) {
      mv.set(value)
      return
    }
    if (!active) return
    const controls = animate(mv, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [mv, value, active, duration, instant])
  return <motion.span>{text}</motion.span>
}

interface TickerMathProps {
  chips: number
  mult: number
  total: number
  choro: ChoroBeat | null
  reduced: boolean
  chipsRef?: RefObject<HTMLSpanElement | null>
}

/** The `chips × mult = total` row. Outside a choreography the counters
 *  count up on the score change; during one (13.3) they build on their
 *  beats (see CountUp). */
export function TickerMath({ chips, mult, total, choro, reduced, chipsRef }: TickerMathProps) {
  const beat = choro?.beat ?? 0
  const instant = choro?.skipped ?? false
  const dur = reduced ? 0.15 : undefined
  const multAnim =
    choro && !reduced
      ? beat === 4
        ? { scale: [1, 1.35, 1], x: 0 }
        : beat === 5
          ? { scale: 1, x: [0, -14, 0] }
          : { scale: 1, x: 0 }
      : { scale: 1, x: 0 }
  const chipsAnim = choro && !reduced && beat === 5 ? { x: [0, 14, 0] } : { x: 0 }
  return (
    <span className={`score-ticker-math${total === 0 ? ' score-ticker--idle' : ''}`}>
      <motion.span
        className="score-ticker-chips"
        ref={chipsRef}
        animate={chipsAnim}
        transition={{ duration: CHOREO.chip.duration, ease: EASING.out }} // chip pop
      >
        <CountUp value={chips} active={!choro || beat >= 3} duration={dur ?? 0.45} instant={instant} />
      </motion.span>{' '}
      ×{' '}
      <motion.span
        className={`score-ticker-mult${choro && beat === 4 ? ' score-ticker-mult--flare' : ''}`}
        animate={multAnim}
        transition={{ duration: CHOREO.skip.duration, ease: EASING.out }} // mult pop
      >
        <CountUp value={mult} active={!choro || beat >= 4} duration={dur ?? 0.2} instant={instant} />
      </motion.span>{' '}
      ={' '}
      <span className="score-ticker-total">
        <CountUp value={total} active={!choro || beat >= 5} duration={dur ?? 0.5} instant={instant} />
      </span>
    </span>
  )
}
