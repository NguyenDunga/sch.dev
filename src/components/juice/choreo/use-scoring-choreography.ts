// 13.3 — the scoring choreography state machine (UX §6).
//
// A state machine over the 7-beat timeline: `lastScore` drives it — a new
// scored result starts beat 1 and advances 2→7 on `beatDurations` (13.1).
// After the resolve, the numbers rest for REST_MS (1.5s) before the end
// (skipped under reduced motion). The presentation layer
// (scoring-choreography.tsx) renders the per-beat elements.
//
// 13b.4 — the beats are driven by a single Motion timeline (useAnimate), not
// a setTimeout chain (choreo-timeline). Skip: any pointerdown / keydown
// (except the Score button, gated by `beat < 7`) ends the sequence — the
// timeline stops and the state snaps to beat 7. Reduced motion (UX §8): the
// whole sequence runs at ~0.35× and the overlay drops the flights.
//
// The engine is untouched — this reads `lastScore` (already resolved by
// `score()`) and only orchestrates the presentation (UX §0).

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimate, useMotionValue, useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { isSome } from '@/core/helpers'
import type { Score } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { beatDurations, cashCoinCount, REST_MS, type Beat, type ChoroSeq, type PlaySnapshot } from './choreography'
import { playBeatTimeline, type AnimateFn } from './logic/choreo-timeline'

export interface ChoroState {
  seq: ChoroSeq | null
  beat: Beat
  skipped: boolean
}

export interface ScoringChoreographyState {
  seq: ChoroSeq | null
  beat: Beat
  skipped: boolean
  /** End the sequence now (skip). */
  skip: () => void
  /** True when the OS prefers reduced motion (the fast sequence). */
  reduced: boolean
}

/**
 * Drives the 7-beat choreography for the current `lastScore`. Returns the
 * current beat (0 = idle, 1 = reveal, …, 7 = settled) and the sequence.
 */
// eslint-disable-next-line max-lines-per-function -- the 7-beat timeline is a single cohesive unit; splitting it would obscure the beat-advancement logic.
export function useScoringChoreography(snapshotRef: { current: unknown | null }): ScoringChoreographyState {
  const lastScore = useRunStore((s) => s.lastScore)
  const reduced = useFramerReducedMotion() ?? false
  const [state, setState] = useState<ChoroState>({ seq: null, beat: 0, skipped: false })
  const seenRef = useRef(lastScore)
  const runIdRef = useRef(0)
  const clock = useMotionValue(0)
  const [, animate] = useAnimate()
  const currentAnimRef = useRef<{ stop: () => void } | null>(null)

  /** Stop the running timeline (skip / a new score / unmount). */
  const stop = useCallback(() => {
    currentAnimRef.current?.stop()
    currentAnimRef.current = null
  }, [])

  const start = useCallback(
    (score: Score) => {
      stop()
      runIdRef.current += 1
      const myRun = runIdRef.current
      const seq: ChoroSeq = { runId: myRun, score, snapshot: snapshotRef.current as PlaySnapshot | null }
      setState({ seq, beat: 1, skipped: false })

      const coins = seq.snapshot?.coins ?? []
      const d = beatDurations(score, coins.length, cashCoinCount(coins), reduced)

      // The 7-beat timeline: a single Motion timeline advances the clock
      // through the beats (choreo-timeline); a stale runId (skip or a new
      // score) ends the chain.
      const setBeat = (beat: number) =>
        setState((s) => (s.seq && s.seq.runId === myRun ? { ...s, beat: beat as Beat } : s))
      const isStale = () => runIdRef.current !== myRun

      // The framer `animate` overload set is not directly assignable to
      // the narrow AnimateFn — wrap it (the call resolves the value-target overload).
      const anim: AnimateFn = (clock, to, options) => animate(clock, to, options)
      void playBeatTimeline({
        clock,
        animate: anim,
        durations: d,
        restMs: REST_MS,
        reduced,
        isStale,
        onBeat: setBeat,
        onAnim: (a) => {
          currentAnimRef.current = a
        },
      })
    },
    [stop, reduced, snapshotRef, animate, clock],
  )

  // A new scored result starts a sequence; a cleared lastScore (a new run)
  // resets to idle. `lastScore` is an Option — check `isSome`, not `.kind`.
  useEffect(() => {
    if (lastScore === seenRef.current) return
    seenRef.current = lastScore
    if (!isSome(lastScore)) {
      stop()
      runIdRef.current += 1
      // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate reset: the choreography resets to idle when lastScore is cleared (a new run).
      setState({ seq: null, beat: 0, skipped: false })
      return
    }
    start(lastScore.value)
  }, [lastScore, start, stop])

  // Stop the timeline on unmount.
  useEffect(() => stop, [stop])

  const skip = useCallback(() => {
    // Invalidate the running timeline (its stale check ends the chain) and
    // snap to the settled beat.
    runIdRef.current += 1
    stop()
    setState((s) => (s.seq && s.beat < 7 ? { ...s, beat: 7, skipped: true } : s))
  }, [stop])

  useSkipListener(skip)

  return { seq: state.seq, beat: state.beat, skipped: state.skipped, skip, reduced }
}

/** Any pointerdown / keydown skips the sequence (UX §6: "any input skips"). */
function useSkipListener(skip: () => void): void {
  useEffect(() => {
    const onPointer = () => skip()
    const onKey = () => skip()
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [skip])
}
