// @vitest-environment jsdom
//
// 13a.7 — Pre-computed score + auto-end score phase (WBS 13a.7):
//   - the projected chips × mult = total is shown live as the tossed coins
//     land — the ticker updates without a click (the "projected" sticker,
//     the landed count builds left→right)
//   - the projection matches the real score exactly (M13 §0): the
//     deterministic pipeline over the locked play — same chips × mult =
//     total (only the coin cash is rolled at score time)
//   - the phase auto-ends when idle: an Echo hand scores itself after the
//     last re-flip — the Score button is a fast-forward, not a gate
//   - the manual Score button still ends the hand early
//
// The projection is a UI flow convenience (like the auto-draw / 13a.1
// auto-score): it reads the store and calls no action; the store is
// untouched (UX §0).

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { none } from '@/core/helpers'
import { projectScore } from '@/core/scoring'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.13a.test.tsx). */
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

/** Force an Echo coin into the first hand slot (presentational test — the
 *  re-flip logic is covered in handFlow.test.ts). */
function forceEcho(): void {
  const hand = useRunStore.getState().hand
  useRunStore.setState({
    hand: hand.map((s, i) =>
      i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'echo' }] } } : s,
    ),
  })
}

describe('13a.7 — pre-computed score + auto-end score phase', () => {
  it('the projected total is shown live as the coins land (no click)', async () => {
    useRunStore.getState().startRun('13a7-live')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    confirmFive()
    expect(useRunStore.getState().handPhase).toBe('buff')
    // The faces are resolved at confirm — capture the locked play for the
    // M13 §0 comparison (the store empties it at score time).
    const playAtConfirm = useRunStore.getState().play

    // The ticker shows the projected sticker while the coins land — no
    // Score click anywhere (the first hand has no lastScore yet: the
    // ticker was idle, now it is live).
    await waitFor(() => expect(screen.getByText(/projected/i)).toBeTruthy(), { timeout: 2000 })

    // As the coins land (stagger 50ms + rise 400ms, 13.2), the landed count
    // builds to 5/5 — the projection is now the full deterministic score.
    await waitFor(() => expect(screen.getByText(/projected 5\/5/i)).toBeTruthy(), { timeout: 2000 })

    // The idle buff auto-ends (13a.1/13a.7) — the real score matches the
    // projection exactly (M13 §0): same chips × mult = total.
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 4000 })
    const ls = useRunStore.getState().lastScore
    const proj = projectScore(playAtConfirm, none, useRunStore.getState().charms, 5)
    expect(ls.some).toBe(true)
    if (ls.some && proj.kind === 'scored' && ls.value.kind === 'scored') {
      expect(ls.value.total).toBe(proj.total)
      expect(ls.value.chips).toBe(proj.chips)
      expect(ls.value.mult).toBe(proj.mult)
      expect(ls.value.tier).toBe(proj.tier)
    }
    // The projection is gone once the hand is scored (the settled
    // choreography display takes over).
    await waitFor(() => expect(screen.queryByText(/projected/i)).toBeNull(), { timeout: 2000 })
  })

  it('an Echo hand scores itself after the last re-flip (Score is a fast-forward, not a gate)', async () => {
    useRunStore.getState().startRun('13a7-echo')
    useRunStore.getState().drawHand()
    forceEcho()
    render(<RunScreen />)
    confirmFive()
    expect(useRunStore.getState().handPhase).toBe('buff')

    // The auto-advance must NOT fire while a re-flip is available.
    await new Promise((r) => setTimeout(r, 2000))
    expect(useRunStore.getState().handPhase).toBe('buff')

    // Re-flip the Echo coin → nothing left to interact with → the hand
    // scores itself (no Score click).
    fireEvent.click(screen.getByRole('button', { name: /re-flip/i }))
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 4000 })
    expect(useRunStore.getState().lastScore.some).toBe(true)
  })

  it('the manual Score button still ends the hand early', async () => {
    useRunStore.getState().startRun('13a7-early')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    confirmFive()
    // Score immediately (before the auto-advance timer fires).
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 3000 })
    expect(useRunStore.getState().lastScore.some).toBe(true)
  })
})
