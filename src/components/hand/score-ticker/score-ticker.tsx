// chips × mult = total for the last hand. Outside a choreography it
// counts up on each score; during one (13.3) the counters build on their
// beats and the cash lands on beat 6. 13a.7: while the toss is live
// (`projection`), the projected total is shown instead — it updates
// without a click as the coins land. `reset` (a new round started): the
// ticker shows its idle state — the previous hand's numbers never linger
// into the new round.
//
// The `chips × mult = total` row + CountUp counters live in ticker-math.tsx
// (150-LOC file rule).

import { useReducedMotion } from 'framer-motion'
import type { RefObject } from 'react'
import { TIERS } from '@/core/balance'
import { isSome } from '@/core/helpers'
import type { Option, Score } from '@/core/types'
import type { Beat } from '@/components/juice/choreo/choreography'
import { TickerMath } from './ticker-math'

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

export function ScoreTicker({
  score,
  projection,
  choro,
  chipsRef,
  cashRef,
  reset,
}: {
  score: Option<Score>
  projection: TossProjection | null
  choro: ChoroBeat | null
  chipsRef?: RefObject<HTMLSpanElement | null>
  cashRef?: RefObject<HTMLSpanElement | null>
  /** A new round started (outside the score phase): reset the ticker to
   *  its idle state. Keeps the grid row's space (min-height) so the layout
   *  doesn't shift. */
  reset?: boolean
}) {
  const reduced = useReducedMotion() ?? false
  if (projection) return <ProjectedTicker projection={projection} reduced={reduced} />
  if (reset || !isSome(score)) {
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
