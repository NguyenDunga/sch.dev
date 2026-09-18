// 13b.8 — the toss timing glue, driven by the toss animation's landing
// events (no setTimeout / landDelay). Each coin fires `onLand(i)` when its
// toss settles; from that single source of truth we:
//   - play the whoosh sfx (13.7) — one per landed coin
//   - advance the live projected total (13a.7) — `landed` counts the coins
//     that have settled (left→right, the 13.2 stagger)
//   - auto-score (13a.1/13a.7) — when every coin has landed AND no re-flip
//     is available, fire handleScore after a short beat to read the total.
// The explicit Score button stays the fast-forward; a double score is a
// no-op (the store only scores from 'buff'). A hand with an available
// re-flip is never auto-scored (the player may want to re-flip first).
// No store changes (UX §0).

import { useCallback, useEffect, useRef, useState } from 'react'
import { isFilled } from '@/core/helpers'
import { projectScore } from '@/core/scoring'
import type { BossRuleId, CharmId, HandPhase, Option, Play } from '@/core/types'
import type { TossProjection } from '@/components/hand/score-ticker/score-ticker'
import { playSfx } from '@/components/juice/sfx'
import { canReflipAt } from './use-run-hooks'

// eslint-disable-next-line max-lines-per-function -- the landing glue is a single cohesive unit (refs + reset effect + handleLand); splitting it would obscure the auto-score flow.
export function useTossLanding(
  handPhase: HandPhase,
  play: Play,
  boss: Option<BossRuleId>,
  charms: CharmId[],
  onScore: () => void,
): (TossProjection & { handleLand: (i: number) => void }) | null {
  const [landed, setLanded] = useState(0)
  const landedSetRef = useRef<Set<number>>(new Set())
  const inBuffRef = useRef(false)
  const totalRef = useRef(0)
  const autoScoreTimerRef = useRef<number | null>(null)
  const onScoreRef = useRef(onScore)
  // eslint-disable-next-line react-hooks/refs -- latest-ref pattern: keep the ref in sync with the latest onScore (stable useCallback).
  onScoreRef.current = onScore
  const reflipAvailableRef = useRef(false)
  // eslint-disable-next-line react-hooks/refs -- latest-ref pattern: keep the ref in sync with the latest re-flip availability (checked on landing).
  reflipAvailableRef.current = play.some((_, i) => canReflipAt(play, handPhase, i))

  const clearAutoScore = useCallback(() => {
    if (autoScoreTimerRef.current !== null) {
      clearTimeout(autoScoreTimerRef.current)
      autoScoreTimerRef.current = null
    }
  }, [])

  // A fresh toss (the phase just became 'buff'): reset the landed count.
  // Re-flips keep the phase 'buff' — no reset; the projection recomputes on
  // the new face (the play prop changes) and the re-flipped coin re-lands.
  useEffect(() => {
    const inBuff = handPhase === 'buff'
    if (inBuff && !inBuffRef.current) {
      inBuffRef.current = true
      setLanded(0)
      landedSetRef.current = new Set()
      totalRef.current = play.filter(isFilled).length
    }
    if (!inBuff) {
      inBuffRef.current = false
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate reset: the landed count is reset when the phase leaves 'buff'.
      setLanded(0)
      clearAutoScore()
    }
  }, [handPhase, play, clearAutoScore])

  // A coin has landed (13b.8): whoosh sfx + advance the projection + the
  // auto-score when every coin has settled and nothing is left to re-flip.
  const handleLand = useCallback(
    (i: number) => {
      playSfx('toss', { rate: 1 + (Math.random() * 0.1 - 0.05) })
      landedSetRef.current.add(i)
      setLanded((cur) => Math.max(cur, i + 1))
      const allLanded = totalRef.current > 0 && landedSetRef.current.size >= totalRef.current
      if (allLanded && !reflipAvailableRef.current) {
        clearAutoScore()
        autoScoreTimerRef.current = window.setTimeout(() => {
          autoScoreTimerRef.current = null
          onScoreRef.current()
        }, 900)
      }
    },
    [clearAutoScore],
  )

  // Clear any pending auto-score on unmount.
  useEffect(() => clearAutoScore, [clearAutoScore])

  if (handPhase !== 'buff') return null
  const total = play.filter(isFilled).length
  if (total === 0) return null
  return { score: projectScore(play, boss, charms, landed), landed, total, handleLand }
}
