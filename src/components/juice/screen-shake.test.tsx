// @vitest-environment jsdom
//
// 13.6 — screen shake (jsdom):
//   - a shake translates the wrapper with exponential decay and settles
//     back to no transform; the rAF loop stops when the decay runs out
//   - **zero under prefers-reduced-motion** (UX §8) — the trigger is a no-op
//   - amplitude is tier-scaled (UX §7) and the resolve beat (5) shakes at
//     the tier's amplitude; the target-clear shakes at 10px

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { shakeScreen } from './screen-shake'
import { ScreenShake } from './screen-shake.tsx'
import { SHAKE_AMPLITUDE, CLEAR_SHAKE_AMPLITUDE } from './choreography'
import { ScoringChoreography } from './scoring-choreography'
import type { ChoroSeq } from './choreography'
import type { Score } from '@/core/types'

/** A controllable rAF (same pattern as particles.test.tsx), supporting
 *  multiple concurrent callbacks (framer-motion uses rAF too). */
const rafCalls = { n: 0 }
const cbs = new Map<number, (t: number) => void>()
let nextId = 1
vi.stubGlobal(
  'requestAnimationFrame',
  vi.fn((cb: (t: number) => void) => {
    rafCalls.n++
    const id = nextId++
    cbs.set(id, cb)
    return id
  }),
)
vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => {
  cbs.delete(id)
}))

function frame(t: number): void {
  const list = [...cbs.entries()]
  cbs.clear()
  for (const [, cb] of list) cb(t)
}

/** The number of live (scheduled) rAF callbacks. */
function scheduledCount(): number {
  return cbs.size
}

/** The reduced-motion toggle. */
let setReduced: (r: boolean) => void = () => {}
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

afterEach(() => {
  cleanup()
  setReduced(false)
})

describe('13.6 — shake mechanics', () => {
  it('translates with exponential decay, then settles to no transform', () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const t0 = performance.now()

    shakeScreen({ amplitude: 8, duration: 300 })
    frame(t0 + 16)
    expect(el.style.transform).not.toBe('') // shaking

    // Run the decay out (300ms).
    for (let i = 1; i < 25; i++) frame(t0 + i * 16)
    expect(el.style.transform).toBe('') // settled

    // The loop stopped: no live callbacks, a stray frame changes nothing.
    expect(scheduledCount()).toBe(0)
    frame(t0 + 400)
    expect(el.style.transform).toBe('')
    unmount()
  })

  it('is ZERO under prefers-reduced-motion (UX §8)', () => {
    setReduced(true)
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const t0 = performance.now()
    shakeScreen({ amplitude: 8, duration: 300 })
    frame(t0 + 16)
    frame(t0 + 32)
    expect(el.style.transform).toBe('')
    unmount()
  })

  it('a zero/negative amplitude is a no-op', () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const t0 = performance.now()
    shakeScreen({ amplitude: 0 })
    frame(t0 + 16)
    expect(el.style.transform).toBe('')
    unmount()
  })

  it('unmount cancels an in-flight shake (no rAF leak)', () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const t0 = performance.now()
    shakeScreen({ amplitude: 8, duration: 300 })
    frame(t0 + 16)
    expect(scheduledCount()).toBeGreaterThan(0) // the loop is live
    unmount()
    expect(scheduledCount()).toBe(0) // unmount cancelled it
  })
})

describe('13.6 — amplitudes (UX §7)', () => {
  it('scales by tier: threeSame 2 … jackpot 8; target-clear 10', () => {
    expect(SHAKE_AMPLITUDE.threeSame).toBe(2)
    expect(SHAKE_AMPLITUDE.tripleRun).toBeGreaterThanOrEqual(3)
    expect(SHAKE_AMPLITUDE.tripleRun).toBeLessThanOrEqual(4)
    expect(SHAKE_AMPLITUDE.fourSame).toBeGreaterThanOrEqual(3)
    expect(SHAKE_AMPLITUDE.fourSame).toBeLessThanOrEqual(4)
    expect(SHAKE_AMPLITUDE.alternating).toBeGreaterThanOrEqual(5)
    expect(SHAKE_AMPLITUDE.alternating).toBeLessThanOrEqual(6)
    expect(SHAKE_AMPLITUDE.fourRow).toBeGreaterThanOrEqual(5)
    expect(SHAKE_AMPLITUDE.fourRow).toBeLessThanOrEqual(6)
    expect(SHAKE_AMPLITUDE.jackpot).toBe(8)
    expect(CLEAR_SHAKE_AMPLITUDE).toBe(10)
    // Escalation: bigger tiers shake harder.
    expect(SHAKE_AMPLITUDE.jackpot).toBeGreaterThan(SHAKE_AMPLITUDE.fourRow)
    expect(SHAKE_AMPLITUDE.fourRow).toBeGreaterThan(SHAKE_AMPLITUDE.threeSame)
  })
})

describe('13.6 — the resolve beat shakes at the tier amplitude', () => {
  it('beat 5 shakes (fourRow → 6px); the overlay is still presentational', async () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const score: Score = { kind: 'scored', tier: 'fourRow', chips: 40, mult: 3, total: 120, cash: 0 }
    const seq: ChoroSeq = { runId: 1, score, snapshot: { coins: [], charms: [] } }
    render(<ScoringChoreography seq={seq} beat={5} reduced={false} chipsRef={{ current: null }} cashRef={{ current: null }} />)

    // Drive the shake; it must be non-identity at some point (fourRow = 6px).
    const t0 = performance.now()
    const seen = new Set<string>()
    for (let i = 0; i < 25; i++) {
      frame(t0 + i * 16)
      seen.add(el.style.transform)
    }
    expect([...seen].some((t) => t !== '')).toBe(true)
    unmount()
    unmount()
  })

  it('a no-match score (kind "none") does not shake (no tier → no amplitude)', async () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const score: Score = { kind: 'none', cash: 0 }
    const seq: ChoroSeq = { runId: 1, score, snapshot: { coins: [], charms: [] } }
    render(<ScoringChoreography seq={seq} beat={5} reduced={false} chipsRef={{ current: null }} cashRef={{ current: null }} />)
    const t0 = performance.now()
    const seen = new Set<string>()
    for (let i = 0; i < 25; i++) {
      frame(t0 + i * 16)
      seen.add(el.style.transform)
    }
    expect(seen.has('')).toBe(true)
    expect([...seen].every((t) => t === '')).toBe(true)
    unmount()
    unmount()
  })
})
