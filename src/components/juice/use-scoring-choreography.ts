// Scoring choreography (13.3) — the 7-beat sequence machine. Starts when
// lastScore changes (the store's score() is synchronous — the UI observes
// the new lastScore and plays over it); a tap/key anywhere during beats
// 1–6 skips to the settled end (beat 7). A stale lastScore at mount
// (shop → run) never replays.
//
// Purely presentational (UX §0): it never mutates state, never gates an
// action. The numbers come from the store's Score; this hook only paces
// the presentation.

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { useReducedMotion } from 'framer-motion'
import { isSome } from '@/core/helpers'
import type { Option, Score } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import {
  beatDurations,
  cashCoinCount,
  type Beat,
  type BeatDurations,
  type ChoroSeq,
  type PlaySnapshot,
} from './choreography'

interface ChoroState {
  seq: ChoroSeq | null
  beat: Beat
  skipped: boolean
}

/** Arm the beat timers (2 → 7) at the given durations (beat 1 is the
 *  present); the timers are tracked in `timers` so a skip/unmount can
 *  clear them. A stale run id never advances the sequence (the `setBeat`
 *  closure guards it). */
function scheduleBeats(
  timers: Set<ReturnType<typeof setTimeout>>,
  d: BeatDurations,
  setBeat: (beat: Beat) => void,
) {
  const plan: [Beat, number][] = [
    [2, d.banner],
    [3, d.chips],
    [4, d.mult],
    [5, d.resolve],
    [6, d.cash],
    [7, d.settle],
  ]
  let at = d.reveal
  for (const [beat, dur] of plan) {
    const timer = setTimeout(() => {
      timers.delete(timer)
      setBeat(beat)
    }, at)
    timers.add(timer)
    at += dur
  }
}

/** A tap/key anywhere during the sequence skips it (UX §0/§6). */
function useSkipListener(active: boolean, skip: () => void) {
  useEffect(() => {
    if (!active) return
    const onDown = () => skip()
    const onKey = () => skip()
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [active, skip])
}

/**
 * The 7-beat sequence machine (13.3). Plays over lastScore:
 * reveal/match (1) → tier banner (2) → chips build (3) → mult flare (4) →
 * resolve (5) → cash fly (6) → settle (7, the end). The visual play
 * snapshot is read from `snapshotRef` at start (the caller captures it at
 * the Score tap, before the store empties the play).
 */
export function useScoringChoreography(snapshotRef: RefObject<PlaySnapshot | null>) {
  const lastScore = useRunStore((s) => s.lastScore)
  const reduced = useReducedMotion() ?? false
  const [state, setState] = useState<ChoroState>({ seq: null, beat: 0, skipped: false })
  const seenRef = useRef<Option<Score>>(lastScore)
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const runIdRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
  }, [])

  const start = useCallback(
    (score: Score) => {
      clearTimers()
      runIdRef.current += 1
      const runId = runIdRef.current
      const seq: ChoroSeq = { runId, score, snapshot: snapshotRef.current }
      setState({ seq, beat: 1, skipped: false })
      const coins = seq.snapshot?.coins ?? []
      const d = beatDurations(score, coins.length, cashCoinCount(coins), reduced)
      scheduleBeats(
        timersRef.current,
        d,
        (beat) => setState((s) => (s.seq && s.seq.runId === runId ? { ...s, beat } : s)),
      )
    },
    [clearTimers, reduced, snapshotRef],
  )

  useEffect(() => {
    if (!isSome(lastScore) || lastScore === seenRef.current) return
    seenRef.current = lastScore
    start(lastScore.value)
  }, [lastScore, start])

  // Clear any pending beat timers on unmount.
  useEffect(() => clearTimers, [clearTimers])

  /** Skip (13.4): snap to the settled end; the store's numbers are
   *  untouched (score() set them before the sequence started). */
  const skip = useCallback(() => {
    clearTimers()
    setState((s) => (s.seq && s.beat < 7 ? { ...s, beat: 7, skipped: true } : s))
  }, [clearTimers])

  useSkipListener(Boolean(state.seq) && state.beat < 7, skip)

  return { seq: state.seq, beat: state.beat, skipped: state.skipped, skip, reduced }
}
