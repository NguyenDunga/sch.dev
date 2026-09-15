// @vitest-environment jsdom
//
// 13.5 — particles + confetti (jsdom):
//   - the ParticleLayer canvas mounts; a burst lives, draws, and dies — the
//     rAF loop runs only while particles are alive (UX §9)
//   - reduced motion (UX §8): minimal — the same burst spawns fewer
//     particles
//   - the blind-clear confetti fires exactly on the run → shop transition
//     (the store's endBlind) and not on other phase changes
//   - CSS-var colors resolve to the hex tokens (canvas can't paint vars)

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import {
  activeParticleCount,
  disposeParticles,
  emitBurst,
  emitConfetti,
  resolveColor,
  tierColor,
} from './particles'
import { BlindClearConfetti, ParticleLayer } from './particles.tsx'

/** A 2D-context stub: jsdom has no canvas; the engine only needs the draw
 *  calls to exist (we assert on call counts, not pixels). */
const ctx2d = {
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  globalAlpha: 1,
  fillStyle: '',
}
const rafCalls = { n: 0 }
let rafImpl: (t: number) => void = () => {}
let setReduced: (r: boolean) => void = () => {}

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx2d as unknown as CanvasRenderingContext2D)
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((cb: (t: number) => void) => {
      rafCalls.n++
      rafImpl = cb
      return rafCalls.n
    }),
  )
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  // The reduced-motion toggle (same pattern as run.juice.test.tsx).
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    addEventListener: (_e: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  setReduced = (r: boolean) => {
    mql.matches = r
    listeners.forEach((fn) => fn())
  }
})

/** Drive one animation frame at a fake timestamp. */
function frame(t: number): void {
  const cb = rafImpl
  rafImpl = () => {}
  cb(t)
}

afterEach(() => {
  cleanup()
  disposeParticles() // drop any particles the (stubbed) loop never drained
  setReduced(false)
  vi.stubGlobal('devicePixelRatio', 1)
})

describe('13.5 — particle layer', () => {
  it('a burst spawns particles, draws them, and the loop stops when they die', () => {
    render(<ParticleLayer />)
    expect(document.querySelector('canvas.particle-layer')).toBeTruthy()

    emitBurst({ x: 100, y: 100, color: 'var(--tier-jackpot)', count: 10 })
    expect(activeParticleCount()).toBe(10)

    // Run the loop to expiry (ttl ≤ 550ms).
    let t = 1000
    for (let i = 0; i < 60 && activeParticleCount() > 0; i++) {
      frame(t)
      t += 16
    }
    expect(activeParticleCount()).toBe(0)
    expect(ctx2d.arc).toHaveBeenCalled() // the dots were drawn
    expect(ctx2d.clearRect).toHaveBeenCalled()

    // The loop stopped: no further rAF is scheduled once the last particle
    // dies (the frame that killed them does not reschedule).
    const scheduled = rafCalls.n
    frame(t + 16) // a stray callback is a no-op
    expect(rafCalls.n).toBe(scheduled)
  })

  it('reduced motion: the same burst is minimal (UX §8)', () => {
    setReduced(true)
    render(<ParticleLayer />)
    emitBurst({ x: 100, y: 100, color: '#fff', count: 10 })
    const reducedCount = activeParticleCount()
    expect(reducedCount).toBeLessThan(10)
    expect(reducedCount).toBeGreaterThan(0)
  })

  it('confetti spawns 200–300 pieces in the theme colors', () => {
    render(<ParticleLayer />)
    emitConfetti()
    const n = activeParticleCount()
    expect(n).toBeGreaterThanOrEqual(200)
    expect(n).toBeLessThanOrEqual(300)
    // The rects were drawn (confetti is the 'rect' shape).
    frame(1000)
    expect(ctx2d.fillRect).toHaveBeenCalled()
  })

  it('caps the canvas DPR at 2 (UX §9: no 3× retina overdraw)', () => {
    vi.stubGlobal('devicePixelRatio', 3)
    render(<ParticleLayer />)
    const c = document.querySelector('canvas.particle-layer') as HTMLCanvasElement
    expect(c.width).toBe(window.innerWidth * 2)
    expect(c.height).toBe(window.innerHeight * 2)
  })

  it('uses the real DPR when it is under the cap', () => {
    vi.stubGlobal('devicePixelRatio', 1.5)
    render(<ParticleLayer />)
    const c = document.querySelector('canvas.particle-layer') as HTMLCanvasElement
    expect(c.width).toBe(Math.floor(window.innerWidth * 1.5))
    expect(c.height).toBe(Math.floor(window.innerHeight * 1.5))
  })
})

describe('13.5 — colors from the tier tokens', () => {
  it('resolveColor falls back to the hex tokens when the var is unset (jsdom)', () => {
    expect(resolveColor('var(--tier-jackpot)')).toBe('#e8b04b')
    expect(resolveColor('var(--primary)')).toBe('#f0654a')
    expect(resolveColor('#123456')).toBe('#123456')
  })

  it('tierColor maps every tier to its token', () => {
    expect(tierColor('jackpot')).toBe('#e8b04b')
    expect(tierColor('fourRow')).toBe('#8b6fc7')
    expect(tierColor('alternating')).toBe('#2fa79b')
    expect(tierColor('fourSame')).toBe('#4a82c4')
    expect(tierColor('tripleRun')).toBe('#5aa469')
    expect(tierColor('threeSame')).toBe('#9a9086')
  })
})



describe('13.5 — blind-clear confetti', () => {
  it('fires exactly on the run → shop transition (the store endBlind)', async () => {
    useRunStore.getState().startRun('particles-clear')
    expect(useRunStore.getState().phase).toBe('run')
    render(<BlindClearConfetti />)

    // Other transitions: no confetti.
    useRunStore.setState({ phase: 'menu' })
    await waitFor(() => expect(useRunStore.getState().phase).toBe('menu'))
    expect(activeParticleCount()).toBe(0)
    useRunStore.setState({ phase: 'run' })
    await waitFor(() => expect(useRunStore.getState().phase).toBe('run'))
    expect(activeParticleCount()).toBe(0)

    // The blind clear (endBlind → shop): confetti.
    useRunStore.setState({ phase: 'shop' })
    await waitFor(() => expect(activeParticleCount()).toBeGreaterThan(0))
  })

  it('unmounting the layer disposes the loop (no leak)', () => {
    render(<ParticleLayer />)
    emitBurst({ x: 10, y: 10, color: '#fff', count: 8 })
    const { unmount } = render(<ParticleLayer />)
    unmount()
    expect(activeParticleCount()).toBe(0)
  })
})
