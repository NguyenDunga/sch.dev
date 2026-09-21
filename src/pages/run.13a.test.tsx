// @vitest-environment jsdom
//
// 13a.1 — auto-advance the buff phase (UX §3, WBS 13a.1):
//   - a hand with no Echo coin never stops in `buff` — after the toss lands,
//     the run scores itself (no Score click)
//   - a hand with an unused Echo coin still waits for input (the player may
//     re-flip first); the explicit Score button still works
//   - auto vs. manual score changes no number (M13 §0): same seed, same
//     blindScore / runScore / cash / lastScore
//
// The auto-advance is a UI flow convenience (like the auto-draw): it calls
// the same store `score` the button calls; the store is untouched.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import type { RunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.juice.test.tsx). */
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

/** Pick 5 coins and confirm (play → toss → buff, synchronous in the store). */
function confirmFive(): void {
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
  }
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
}

/** The numbers the auto-vs-manual comparison cares about (M13 §0). */
function numbers(s: RunStore): Record<string, unknown> {
  const ls = s.lastScore
  return {
    blindScore: s.blindScore,
    runScore: s.runScore,
    cash: s.cash,
    lastScore: ls.some
      ? ls.value.kind === 'scored'
        ? { kind: 'scored', chips: ls.value.chips, mult: ls.value.mult, total: ls.value.total, cash: ls.value.cash }
        : { kind: 'none', cash: ls.value.cash }
      : 'none',
    handsLeft: s.handsLeft,
    discard: s.deck.discardPile.map((c) => c.id),
  }
}

describe('13a.1 — auto-advance the buff phase', () => {
  it('a hand with no Echo coin never stops in buff (auto-score after the toss lands)', { timeout: 10000 }, async () => {
    useRunStore.getState().startRun('13a1-auto')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    confirmFive()
    expect(useRunStore.getState().handPhase).toBe('buff')

    // No Score click: the run scores itself once the last coin has landed
    // (stagger + rise + beat ≈ 700ms for 5 coins), then the score choreography
    // plays (≈2.4s + the 1.5s post-resolve rest) before the hand settles to
    // draw and auto-draws to play.
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 8000 })
    expect(useRunStore.getState().lastScore.some).toBe(true)
  })

  it('a hand with an unused Echo coin still waits for input', { timeout: 10000 }, async () => {
    useRunStore.getState().startRun('13a1-echo')
    useRunStore.getState().drawHand()
    // Force an Echo coin into the first hand slot (presentational test —
    // the re-flip logic is covered in handFlow.test.ts).
    const hand = useRunStore.getState().hand
    useRunStore.setState({
      hand: hand.map((s, i) =>
        i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'echo' }] } } : s,
      ),
    })
    render(<RunScreen />)
    confirmFive()
    expect(useRunStore.getState().handPhase).toBe('buff')

    // The auto-advance must NOT fire while a re-flip is available.
    await new Promise((r) => setTimeout(r, 1500))
    expect(useRunStore.getState().handPhase).toBe('buff')

    // The explicit Score button still ends the hand.
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 8000 })
  })

  it('auto vs. manual score changes no number (M13 §0)', async () => {
    // Seed note: the first hand must NOT clear blind 1's target (150) — a
    // cleared blind ends in the shop and never settles to `play`. `13a-x-0`
    // scores 15 with no echo in the first five (re-probe after balance
    // changes: DIFFICULTY rescales the starter deck, which reshuffles hands).
    // Run A: let the buff auto-advance.
    useRunStore.getState().startRun('13a-x-0')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    confirmFive()
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 8000 })
    const auto = numbers(useRunStore.getState())
    cleanup()

    // Run B: the same seed, but the player taps Score the instant the buff
    // opens (before the auto-advance timer could fire).
    useRunStore.getState().startRun('13a-x-0')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    confirmFive()
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 8000 })
    const manual = numbers(useRunStore.getState())

    expect(auto).toEqual(manual)
  }, 15000)
})
