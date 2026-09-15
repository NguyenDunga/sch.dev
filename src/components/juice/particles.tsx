// Particle layer (13.5) — the React side of the particle engine
// (particles.ts): the fixed full-viewport canvas + the blind-clear confetti
// trigger. Purely presentational (UX §0).

import { useEffect, useRef } from 'react'
import { useRunStore } from '@/state/runStore'
import { attachLayer, disposeParticles, emitConfetti } from './particles'
import { CLEAR_SHAKE_AMPLITUDE } from './choreography'
import { shakeScreen } from './screen-shake'

/** The fixed full-viewport canvas layer (pointer-events: none — it never
 *  blocks input, UX §0/§9). Mount once at the app root. */
export function ParticleLayer() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    attachLayer(ref.current)
    const onResize = () => attachLayer(ref.current)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      disposeParticles()
    }
  }, [])
  return <canvas ref={ref} className="particle-layer" aria-hidden />
}

/** Confetti on blind clear (UX §5 `blind-clear`): the store moves
 *  run → shop exactly when the target is met (endBlind). */
export function BlindClearConfetti() {
  const phase = useRunStore((s) => s.phase)
  const prev = useRef(phase)
  useEffect(() => {
    if (prev.current === 'run' && phase === 'shop') {
      emitConfetti()
      shakeScreen({ amplitude: CLEAR_SHAKE_AMPLITUDE, duration: 350 }) // UX §7: target-clear 10px
    }
    prev.current = phase
  }, [phase])
  return null
}
