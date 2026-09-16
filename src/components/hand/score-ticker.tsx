import { useEffect } from 'react'
import type { RefObject } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'
import { TIERS } from '@/core/balance'
import { isSome } from '@/core/helpers'
import type { Option, Score } from '@/core/types'
import { EASING } from '@/lib/motion'
import type { Beat } from '@/components/juice/choreography'

/** The active choreography beat (13.3): the run id (a remount key so each
 *  hand's counters start from zero), the current beat, and whether the
 *  sequence was skipped (a skip snaps the counters to the settled end). */
export interface ChoroBeat {
  runId: number
  beat: Beat
  skipped: boolean
}

/** 13a.7 — the live projected score during the toss (the coins landing):
 *  the deterministic pipeline over the first `landed` coins (projectScore)
 *  — it matches the real score's chips × mult = total exactly (M13 §0). */
export interface TossProjection {
  score: Score
  /** How many of the `total` tossed coins have landed (left→right). */
  landed: number
  total: number
}

/** A number that counts up when `active` turns true (0 → value).
 *  `instant` snaps to the value with no animation — a skip (UX §6: a skip
 *  snaps to the settled end) or the reduced-motion fast counters (UX §8). */
function CountUp({
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
 *  beats — chips tick on beat 3, the mult flares on beat 4 (pulses +
 *  grows, color ramps toward hot), the total counts up on the resolve
 *  (beat 5, chips and mult slide together and collide). The row is
 *  remounted per run id (key) so each hand's counters start from zero. */
function TickerMath({ chips, mult, total, choro, reduced, chipsRef }: TickerMathProps) {
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
        transition={{ duration: 0.3, ease: EASING.out }}
      >
        <CountUp value={chips} active={!choro || beat >= 3} duration={dur ?? 0.45} instant={instant} />
      </motion.span>{' '}
      ×{' '}
      <motion.span
        className={`score-ticker-mult${choro && beat === 4 ? ' score-ticker-mult--flare' : ''}`}
        animate={multAnim}
        transition={{ duration: 0.25, ease: EASING.out }}
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

/** 13a.7 — the live projected `chips × mult = total` as the tossed coins
 *  land: the counters build as coins land (no remount — each landing
 *  animates from the previous value), and a "projected" sticker marks it as
 *  the pre-computed total (it matches the real score exactly, M13 §0).
 *  The tier name updates as the pattern emerges (e.g. 3-same → 4-row). */
function ProjectedTicker({ projection, reduced }: { projection: TossProjection; reduced: boolean }) {
  const { score, landed, total } = projection
  const scored = score.kind === 'scored'
  const tierName = scored ? TIERS.find((t) => t.id === score.tier)!.name : '—'
  return (
    <div className="score-ticker" aria-live="polite">
      <span className="score-ticker-tier">{tierName}</span>
      <TickerMath
        chips={scored ? score.chips : 0}
        mult={scored ? score.mult : 0}
        total={scored ? score.total : 0}
        choro={null}
        reduced={reduced}
      />
      <span className="score-ticker-projected">projected {landed}/{total}</span>
    </div>
  )
}

/** chips × mult = total for the last hand. Outside a choreography it
 *  counts up on each score; during one (13.3) the counters build on their
 *  beats and the cash lands on beat 6. 13a.7: while the toss is live
 *  (`projection`), the projected total is shown instead — it updates
 *  without a click as the coins land. */
export function ScoreTicker({
  score,
  projection,
  choro,
  chipsRef,
  cashRef,
}: {
  score: Option<Score>
  projection: TossProjection | null
  choro: ChoroBeat | null
  chipsRef?: RefObject<HTMLSpanElement | null>
  cashRef?: RefObject<HTMLSpanElement | null>
}) {
  const reduced = useReducedMotion() ?? false
  if (projection) return <ProjectedTicker projection={projection} reduced={reduced} />
  if (!isSome(score)) {
    return (
      <div className="score-ticker" aria-live="polite">
        <span className="score-ticker-tier">—</span>
        <span className="score-ticker-math score-ticker--idle">— × — = —</span>
      </div>
    )
  }

  const result = score.value
  const scored = result.kind === 'scored'
  const tierName = scored ? TIERS.find((t) => t.id === result.tier)!.name : 'No coins'
  const beat = choro?.beat ?? 0
  const showCash = result.cash > 0 && (!choro || beat >= 6)
  const showTier = !choro || beat >= 2
  const rowKey = choro ? choro.runId : 'static'
  return (
    <div className="score-ticker" aria-live="polite">
      <span className="score-ticker-tier">{showTier ? tierName : '—'}</span>
      <TickerMath
        key={rowKey}
        chips={scored ? result.chips : 0}
        mult={scored ? result.mult : 0}
        total={scored ? result.total : 0}
        choro={choro}
        reduced={reduced}
        chipsRef={chipsRef}
      />
      {showCash && (
        <span ref={cashRef} className="score-ticker-cash">
          +${result.cash} cash
        </span>
      )}
    </div>
  )
}
