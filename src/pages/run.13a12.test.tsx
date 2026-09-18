// @vitest-environment jsdom
//
// 13a.12 — Keyboard & reduced-motion parity for the new input (UX §8, WBS
// 13a.12). The no-pointer paths and the reduced-motion degradation were
// built incrementally (13a.5 shortcuts, 13a.6 D-key + quick-discard, 13.8
// MotionConfig, 13.1–13.3 reduced-motion juice); this file proves the three
// acceptance criteria:
//   1. A full hand can be played, discarded, and scored with the keyboard
//      only — number keys pick, the D key discards a focused coin, Enter
//      confirms, Space scores — the same store actions as the pointer
//      paths (UX §0).
//   2. Reduced-motion drops are instant with the same result (UX §8):
//      * the app root is `MotionConfig reducedMotion="user"` — every
//        transform/layout animation (pick/unpick springs, deal flights,
//        screen slides) is disabled for reduced-motion users;
//      * the discard ghost degrades to a quick fade in place (no flight);
//      * the store result of a hand played under reduced motion is
//        identical to the same hand played without it (juice never
//        mutates state, UX §0).
//   3. Hit targets are ≥44px (UX §3): coin, play slot,
//      charm chip, discard well.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { COIN_SIZES } from '@/components/hand/coin/coin-size'
import { RunScreen } from './run'
import { ghostMotionProps, type Rect } from '@/components/run/discard-ghost'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.13a5.test.tsx). */
const reduced = (() => {
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    setReduced: (r: boolean) => {
      mql.matches = r
      listeners.forEach((fn) => fn())
    },
  }
})()

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(() => {
  cleanup()
  reduced.setReduced(false)
})

/** Fresh run with a drawn hand (skip the draw phase, like run.13a5.test.tsx). */
function freshRun(seed: string): void {
  useRunStore.getState().startRun(seed)
  useRunStore.getState().drawHand()
  render(<RunScreen />)
}

/** The store snapshot that matters for "same result": the discard pile
 *  (discarded + played coins) and whether a score landed. */
function resultSnapshot(): { discard: number[]; scored: boolean } {
  const s = useRunStore.getState()
  return {
    discard: s.deck.discardPile.map((c) => c.id).sort((a, b) => a - b),
    scored: s.lastScore.some,
  }
}

/** Play one full hand by keyboard only: pick 1+2, discard 3 (focus + D),
 *  pick 4, confirm (Enter), score (Space). Returns the result snapshot. */
function playHandByKeyboard(seed: string): { discard: number[]; scored: boolean } {
  freshRun(seed)
  fireEvent.keyDown(window, { key: '1' })
  fireEvent.keyDown(window, { key: '2' })
  const coin3 = screen.getByRole('button', { name: /pick coin 3/i })
  coin3.focus()
  fireEvent.keyDown(coin3, { key: 'd' })
  fireEvent.keyDown(window, { key: '4' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(useRunStore.getState().handPhase).toBe('buff')
  fireEvent.keyDown(window, { key: ' ' })
  return resultSnapshot()
}

describe('13a.12 — a full hand by keyboard only', () => {
  it('pick (number keys) + discard (D on a focused coin) + confirm (Enter) + score (Space)', async () => {
    freshRun('13a12-kb')
    const st = useRunStore.getState()
    const idAt = (i: number) => (st.hand[i].kind === 'filled' ? st.hand[i].coin.id : null)

    // Pick coins 1 and 2 (number keys, focus off a control).
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: '2' })
    let s = useRunStore.getState()
    expect(s.play.filter((p) => p.kind === 'filled')).toHaveLength(2)
    expect(s.hand[0].kind).toBe('empty') // coin 1 left the hand
    expect(s.hand[1].kind).toBe('empty') // coin 2 left the hand

    // Discard coin 3: focus it, press D (the per-coin keyboard discard).
    const coin3 = screen.getByRole('button', { name: /pick coin 3/i })
    coin3.focus()
    fireEvent.keyDown(coin3, { key: 'd' })
    s = useRunStore.getState()
    expect(s.hand[2].kind).toBe('empty') // coin 3 left the hand
    expect(s.deck.discardPile.some((c) => c.id === idAt(2))).toBe(true) // ...into the well

    // Pick coin 4 (a number key again).
    fireEvent.keyDown(window, { key: '4' })
    s = useRunStore.getState()
    expect(s.play.filter((p) => p.kind === 'filled')).toHaveLength(3)

    // Confirm (Enter) → toss → buff.
    fireEvent.keyDown(window, { key: 'Enter' })
    s = useRunStore.getState()
    expect(s.handPhase).toBe('buff')

    // Score (Space) → the score lands and the phase advances past the buff.
    fireEvent.keyDown(window, { key: ' ' })
    expect(useRunStore.getState().lastScore.some).toBe(true)
    await waitFor(
      () => expect(useRunStore.getState().handPhase).not.toBe('buff'),
      { timeout: 3000 },
    )
  })
})

describe('13a.12 — reduced-motion drops (UX §8)', () => {
  it('the store result is identical with reduced motion on vs off (same seed)', () => {
    reduced.setReduced(true)
    const on = playHandByKeyboard('13a12-rm-same')
    cleanup()
    reduced.setReduced(false)
    const off = playHandByKeyboard('13a12-rm-same')
    expect(on).toEqual(off) // the same hand, the same result
    expect(on.scored).toBe(true)
    expect(on.discard.length).toBeGreaterThan(0)
  })

  it('the app root degrades every transform/layout animation (MotionConfig reducedMotion="user")', () => {
    // The mechanism that makes the pick/unpick springs, deal flights, and
    // screen slides instant for reduced-motion users (framer disables all
    // transform/layout animation, keeping opacity/color — UX §8).
    const app = readFileSync('src/App.tsx', 'utf8')
    expect(app).toMatch(/MotionConfig[^>]*reducedMotion="user"/)
  })

  it('the discard ghost degrades to a fade in place (no flight) under reduced motion', () => {
    const from: Rect = { x: 100, y: 100, w: 56, h: 56 }
    const to = { x: 400, y: 200 }

    // Reduced motion (UX §8): a quick fade in place — no x/y flight, so the
    // drop is instant with the same result.
    const rm = ghostMotionProps(true, from, to)
    expect(rm.initial).toEqual({ opacity: 1 })
    expect(rm.animate).toEqual({ opacity: 0 }) // fade only — no x/y/scale
    expect(rm.transition.duration).toBe(0.16) // the quick fade

    // Without reduced motion: the flight to the well + fade.
    const full = ghostMotionProps(false, from, to)
    expect(full.animate.x).toBe(to.x - from.w / 2 - from.x) // dx = 272
    expect(full.animate.y).toBe(to.y - from.h / 2 - from.y) // dy = 72
    expect(full.animate.scale).toBe(0.5)
    expect(full.transition.duration).toBe(0.18) // the 180ms flight
  })
})

describe('13a.12 — hit targets ≥44px (UX §3)', () => {
  /** The value (in rem) of `prop` on the base `.rule` in a css file. */
  function cssRem(file: string, rule: string, prop: string): number {
    const css = readFileSync(file, 'utf8')
    const re = new RegExp(`\\.${rule}\\s*\\{[^}]*\\b${prop}\\s*:\\s*([\\d.]+)rem`)
    const m = css.match(re)
    if (!m) throw new Error(`no ${prop} (rem) on .${rule} in ${file}`)
    return parseFloat(m[1])
  }

  it('coins, slots, and controls are all ≥ 2.75rem (44px)', () => {
    const coin = 'src/components/hand/play-slot/play-slot.css'
    const run = 'src/style/run.css'
    // 13a.16: the coin is sized by the COIN_SIZES scale (coin-size.ts) — the
    // play-scene sizes (md and up) must stay ≥44px (the UX §3 minimum; the xs
    // size is the shop header icon, not a play-scene hit target).
    for (const size of ['md', 'lg', 'xl'] as const) {
      expect(COIN_SIZES[size].min).toBeGreaterThanOrEqual(44)
    }
    expect(cssRem(coin, 'play-slot', 'min-height')).toBeGreaterThanOrEqual(2.75)
    expect(cssRem(run, 'charm-chip', 'min-height')).toBeGreaterThanOrEqual(2.75)
    expect(cssRem(run, 'discard-well-hole', 'width')).toBeGreaterThanOrEqual(2.75)
    expect(cssRem(run, 'discard-well-hole', 'height')).toBeGreaterThanOrEqual(2.75)
  })
})
