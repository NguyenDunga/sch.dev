// 13b.4 — the 7-beat timeline runner: a single Motion timeline (useAnimate)
// advances a clock motion value through the beats, each segment's length
// coming from the unchanged `beatDurations()` math. A stale runId (skip or
// a new score) ends the chain.

import type { AnimationPlaybackControls, Easing, MotionValue } from 'framer-motion'
import type { Beat, BeatDurations } from '../choreography'

/** A useAnimate-style animate (the framer-motion overload used here): a
 *  motion value → a target, returning a controllable playback handle. */
export type AnimateFn = (
  clock: MotionValue<number>,
  to: number,
  options: { duration: number; ease: Easing },
) => AnimationPlaybackControls

export interface BeatTimeline {
  clock: MotionValue<number>
  animate: AnimateFn
  durations: BeatDurations
  /** The post-resolve rest (REST_MS; 0 under reduced motion). */
  restMs: number
  reduced: boolean
  /** True when the sequence was skipped or replaced (ends the chain). */
  isStale: () => boolean
  onBeat: (beat: Beat) => void
  onAnim: (a: { stop: () => void }) => void
}

/** Run the 7-beat sequence (reveal → banner → chips → mult → resolve →
 *  [rest] → cash → settle), reporting each beat as it starts. */
export async function playBeatTimeline(t: BeatTimeline): Promise<void> {
  const { clock, animate, durations: d, restMs, reduced, isStale, onBeat, onAnim } = t
  clock.set(0)
  let acc = 0
  const step = async (ms: number) => {
    if (ms <= 0) return
    acc += ms
    const a = animate(clock, acc, { duration: ms / 1000, ease: 'linear' })
    onAnim(a)
    await a.finished
  }
  await step(d.reveal)
  if (isStale()) return
  onBeat(2)
  await step(d.banner)
  if (isStale()) return
  onBeat(3)
  await step(d.chips)
  if (isStale()) return
  onBeat(4)
  await step(d.mult)
  if (isStale()) return
  onBeat(5)
  await step(d.resolve)
  if (isStale()) return
  // The post-resolve rest: the score calculation is done — the final
  // numbers rest for restMs before the animation ends (the cash fly +
  // settle follow). Skipped under reduced motion (UX §8: no long beats).
  if (!reduced) await step(restMs)
  if (isStale()) return
  onBeat(6)
  await step(d.cash)
  if (isStale()) return
  onBeat(7)
}
