// Screen shake (13.6) — translate the shaken root a few px with
// exponential decay (SDD UX §7). Amplitude is scaled by tier at the call
// site (choreography.ts `SHAKE_AMPLITUDE`); the decay is 250–350ms.
// **Zero under prefers-reduced-motion** (UX §8) — the trigger is a no-op.
//
// Purely presentational (UX §0): it reads no state, never gates an action,
// and the rAF loop runs only while a shake is active (no idle cost, UX §9).


interface Shake {
  amp: number
  start: number
  dur: number
}

let shake: Shake | null = null
let rafId: number | null = null
let el: HTMLDivElement | null = null

/** Attach/detach the shaken element (the ScreenShake wrapper). */
export function attachShakeEl(node: HTMLDivElement | null): void {
  el = node
  if (!node && rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
    shake = null
  } else if (node) {
    node.style.transform = ''
  }
}

/** Reduced motion (UX §8): the shake is zero. */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Trigger a shake (no-op under reduced motion, UX §8). `amplitude` in px
 *  (tier-scaled, UX §7), `duration` in ms (250–350). */
export function shakeScreen(opts: { amplitude: number; duration?: number }): void {
  if (reducedMotion() || opts.amplitude <= 0) return
  shake = { amp: opts.amplitude, start: performance.now(), dur: opts.duration ?? 300 }
  startLoop()
}

function startLoop(): void {
  if (rafId === null) rafId = requestAnimationFrame(tick)
}

/** One frame: offset = amp · e^(−4t/T) in a random direction; the loop
 *  stops when the decay has run out (UX §7: exponential decay). */
function tick(t: number): void {
  rafId = null
  if (!shake || !el) return
  const e = (t - shake.start) / shake.dur
  if (e >= 1) {
    el.style.transform = ''
    shake = null
    return
  }
  const a = shake.amp * Math.exp(-4 * e)
  const dx = (Math.random() * 2 - 1) * a
  const dy = (Math.random() * 2 - 1) * a
  el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`
  rafId = requestAnimationFrame(tick)
}

