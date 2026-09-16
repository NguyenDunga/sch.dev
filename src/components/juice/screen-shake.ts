// Screen shake (13.6) — translate the shaken root a few px with
// exponential decay (SDD UX §7). Amplitude is scaled by tier at the call
// site (choreography.ts `SHAKE_AMPLITUDE`); the decay is 250–350ms.
// **Zero under prefers-reduced-motion** (UX §8) — the trigger is a no-op.
//
// 13b.5 — driven by a Motion keyframe animation on the ScreenShake wrapper,
// not a module rAF loop. The wrapper registers a trigger; `shakeScreen()`
// fires it. The decay is precomputed as a set of keyframes (amp · e^(−4t/T)
// in a random direction), so the timing lives in Motion (a single declarative
// animation), not a hand-rolled rAF loop.
//
// Purely presentational (UX §0): it reads no state, never gates an action.

type ShakeTrigger = (opts: { amplitude: number; duration: number }) => void

import { SHAKE_DURATION } from '@/lib/motion'

let trigger: ShakeTrigger | null = null

/** Register/unregister the shake trigger (the ScreenShake wrapper). */
export function setShakeTrigger(fn: ShakeTrigger | null): void {
  trigger = fn
}

/** Reduced motion (UX §8): the shake is zero. */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Trigger a shake (no-op under reduced motion, UX §8). `amplitude` in px
 *  (tier-scaled, UX §7), `duration` in ms (250–350). */
export function shakeScreen(opts: { amplitude: number; duration?: number }): void {
  if (reducedMotion() || opts.amplitude <= 0) return
  trigger?.({ amplitude: opts.amplitude, duration: opts.duration ?? SHAKE_DURATION })
}
