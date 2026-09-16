// @vitest-environment jsdom
//
// 13.6 — screen shake (jsdom, 13b.5 Motion-based):
//   - a shake translates the wrapper with exponential decay and settles
//     back to the identity transform (the Motion keyframe animation runs on
//     real rAF, so the test waits in real time)
//   - **zero under prefers-reduced-motion** (UX §8) — the trigger is a no-op
//   - amplitude is tier-scaled (UX §7) and the resolve beat (5) shakes at
//     the tier's amplitude; the target-clear shakes at 10px
//
// 13b.5 note: the shake is now a Motion keyframe animation on the wrapper
// (no module rAF loop). The assertions check the *semantic* behaviour —
// the wrapper is non-identity mid-shake and identity after — rather than
// counting rAF callbacks (Motion owns its own loop).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { shakeScreen } from './screen-shake'
import { ScreenShake } from './screen-shake.tsx'
import { SHAKE_AMPLITUDE, CLEAR_SHAKE_AMPLITUDE } from './choreography'
import { ScoringChoreography } from './scoring-choreography'
import type { ChoroSeq } from './choreography'
import type { Score } from '@/core/types'

/** The reduced-motion toggle (the module checks matchMedia directly). */
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

/** Identity transform (no offset). Motion writes `translateX(0px)
 *  translateY(0px)` at rest and leaves the transform unset before the first
 *  shake — both count as identity. */
function isIdentity(el: HTMLElement): boolean {
  const t = el.style.transform
  return t === '' || t === 'none' || t === 'translateX(0px) translateY(0px)'
}
function isNonIdentity(el: HTMLElement): boolean {
  return !isIdentity(el)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

afterEach(() => {
  cleanup()
  setReduced(false)
})

describe('13.6 — shake mechanics', () => {
  it('translates with exponential decay, then settles to the identity transform', async () => {
    render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    expect(isIdentity(el)).toBe(true) // at rest

    shakeScreen({ amplitude: 8, duration: 300 })
    // mid-shake: a non-identity offset appears
    await waitFor(() => expect(isNonIdentity(el)).toBe(true), { timeout: 300 })
    // after the decay (300ms): back to identity
    await waitFor(() => expect(isIdentity(el)).toBe(true), { timeout: 600 })
    // and it stays there (no lingering offset)
    await wait(100)
    expect(isIdentity(el)).toBe(true)
  })

  it('is ZERO under prefers-reduced-motion (UX §8)', async () => {
    setReduced(true)
    render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    shakeScreen({ amplitude: 8, duration: 300 })
    await wait(150)
    expect(isIdentity(el)).toBe(true)
  })

  it('a zero/negative amplitude is a no-op', async () => {
    render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    shakeScreen({ amplitude: 0 })
    await wait(150)
    expect(isIdentity(el)).toBe(true)
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

    // The beat-5 shake fires; the wrapper must be non-identity at some point.
    await waitFor(() => expect(isNonIdentity(el)).toBe(true), { timeout: 500 })
    // and settle back to identity.
    await waitFor(() => expect(isIdentity(el)).toBe(true), { timeout: 600 })
    unmount()
    unmount()
  })

  it('a no-match score (kind "none") does not shake (no tier → no amplitude)', async () => {
    const { unmount } = render(<ScreenShake>content</ScreenShake>)
    const el = document.querySelector('.screen-shake') as HTMLDivElement
    const score: Score = { kind: 'none', cash: 0 }
    const seq: ChoroSeq = { runId: 1, score, snapshot: { coins: [], charms: [] } }
    render(<ScoringChoreography seq={seq} beat={5} reduced={false} chipsRef={{ current: null }} cashRef={{ current: null }} />)
    await wait(200)
    // Never shakes: the wrapper stays identity the whole time.
    expect(isIdentity(el)).toBe(true)
    unmount()
    unmount()
  })
})
