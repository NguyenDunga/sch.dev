// @vitest-environment jsdom
//
// 13a.6 — drop-zone score & discard areas (UX §3, WBS 13a.6):
//   - the Discard mode toggle is GONE (drag-to-well / D key / the corner
//     quick-discard hotspot replace it)
//   - the discard well is an always-live drop target (the dnd routing is
//     unit-tested in coin-dnd.test.tsx; the pointer drag itself needs real
//     pointer geometry, like 13a.5)
//   - the per-coin D key is the keyboard discard path (no-pointer users):
//     focus a coin, press D — the draw-enchant redraw pip still works
//   - the corner quick-discard hotspot discards the hovered coin (pointer
//     handoff) or the whole selection
//   - every path calls the same store `discard` (UX §0 — no number changes
//     beyond the discard itself)

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

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

/** The store numbers a discard must never change (UX §0). */
function discardInvariants() {
  const s = useRunStore.getState()
  return {
    blindScore: s.blindScore,
    runScore: s.runScore,
    cash: s.cash,
    handsLeft: s.handsLeft,
    play: s.play,
    lastScore: s.lastScore,
  }
}

describe('13a.6 — the Discard mode toggle is gone', () => {
  it('no Discard toggle button in the play phase (the quick-discard hotspot is not a toggle)', () => {
    freshRun('13a6-no-toggle')
    // The old mode toggle was a button named exactly "Discard" / "Discarding".
    expect(screen.queryByRole('button', { name: 'Discard' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Discarding' })).toBeNull()
    // The corner quick-discard hotspot is present (its own accessible name).
    expect(screen.getByRole('button', { name: /quick discard/i })).toBeTruthy()
    // A plain tap still PICKS (no mode to be stuck in).
    const before = useRunStore.getState().play
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
    expect(useRunStore.getState().play).not.toEqual(before)
    expect(useRunStore.getState().handPhase).toBe('play')
  })

  it('the discard well is an always-live drop target (13a.6)', () => {
    freshRun('13a6-well')
    // The well is wrapped in the droppable (the drag routing is unit-tested
    // in coin-dnd.test.tsx — routeDrop('hand-N', 'discard-well')).
    expect(document.querySelector('.discard-well-drop')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Discard pile, 0 coins' })).toBeTruthy()
  })
})

describe('13a.6 — the per-coin D key (keyboard discard path)', () => {
  it('focus + D discards the coin (store `discard` + ghost flight)', async () => {
    freshRun('13a6-key-d')
    const invariants = discardInvariants()
    const coin = screen.getAllByRole('button', { name: /pick coin 1/i })[0]
    coin.focus()
    fireEvent.keyDown(coin, { key: 'd' })

    // The coin left the hand; the discard pile grew.
    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(7)
    expect(screen.getByRole('img', { name: 'Discard pile, 1 coins' })).toBeTruthy()
    // Nothing else changed (UX §0).
    expect(discardInvariants()).toEqual(invariants)
    // The ghost is in flight (portaled to <body>) and removes itself.
    expect(document.querySelector('.discard-ghost')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('.discard-ghost')).toBeNull(), { timeout: 2000 })
  })

  it('D on a draw-enchant coin: the redraw pip shows and the redraw lands', async () => {
    // Force a Draw-2 coin into the first hand slot (presentational test —
    // the store logic is covered in handFlow.test.ts). The setState happens
    // BEFORE the render (a store update outside a React event does not
    // re-render synchronously — same pattern as run.juice.test.tsx).
    useRunStore.getState().startRun('13a6-key-draw')
    useRunStore.getState().drawHand()
    const st = useRunStore.getState()
    useRunStore.setState({
      hand: st.hand.map((s, i) =>
        i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'draw', count: 2 }] } } : s,
      ),
    })
    render(<RunScreen />)
    // The redraw pip (↻2 badge) is visible on the coin before the discard.
    expect(screen.getByText('↻2')).toBeTruthy()

    const coin = screen.getAllByRole('button', { name: /pick coin 1/i })[0]
    coin.focus()
    fireEvent.keyDown(coin, { key: 'd' })

    // The Draw-2 coin is gone; a full hand has one empty slot, so only one
    // of the two redraws lands: 24 − 8 dealt − 1 redraw = 15 left (m13a deck).
    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(8)
    expect(screen.getByRole('img', { name: 'Draw pile, 15 coins' })).toBeTruthy()
    await waitFor(() => expect(document.querySelector('.discard-ghost')).toBeNull(), { timeout: 2000 })
  })

  it('D does nothing when the coin is not in the play phase', () => {
    freshRun('13a6-key-buff')
    // Pick 1 + confirm → buff (the hand coins are disabled there).
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useRunStore.getState().handPhase).toBe('buff')
    const before = useRunStore.getState()
    const coin = screen.getAllByRole('button', { name: /pick coin/i })[0]
    fireEvent.keyDown(coin, { key: 'd' })
    expect(useRunStore.getState()).toEqual(before)
  })
})

describe('13a.6 — the corner quick-discard hotspot', () => {
  it('hovering the hotspot discards the hovered coin (pointer handoff)', async () => {
    freshRun('13a6-hover')
    const invariants = discardInvariants()
    const coin = screen.getAllByRole('button', { name: /pick coin 3/i })[0]
    const chip = screen.getByRole('button', { name: /quick discard/i })

    // The pointer handoff: enter the coin, leave it, enter the hotspot —
    // within the grace window (synchronous here, the 120ms timer never fires).
    fireEvent.pointerEnter(coin)
    fireEvent.pointerLeave(coin)
    fireEvent.pointerEnter(chip)

    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(7)
    expect(screen.getByRole('img', { name: 'Discard pile, 1 coins' })).toBeTruthy()
    expect(discardInvariants()).toEqual(invariants)
    await waitFor(() => expect(document.querySelector('.discard-ghost')).toBeNull(), { timeout: 2000 })
  })

  it('with no hovered coin, the hotspot discards the whole selection', () => {
    freshRun('13a6-sel')
    const invariants = discardInvariants()
    // Ctrl+A selects all 8; the click path (no hover) discards the selection.
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(8)

    fireEvent.click(screen.getByRole('button', { name: /quick discard/i }))

    expect(screen.queryAllByRole('button', { name: /pick coin/i })).toHaveLength(0)
    expect(screen.getByRole('img', { name: 'Discard pile, 8 coins' })).toBeTruthy()
    expect(discardInvariants()).toEqual(invariants)
    // The selection is cleared after the discard.
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(0)
  })

  it('with nothing hovered or selected, the hotspot discards nothing', () => {
    freshRun('13a6-noop')
    const before = useRunStore.getState()
    fireEvent.pointerEnter(screen.getByRole('button', { name: /quick discard/i }))
    expect(useRunStore.getState()).toEqual(before)
  })

  it('a tap (pointerenter + click of the same gesture) discards only once', () => {
    freshRun('13a6-tap')
    const coin = screen.getAllByRole('button', { name: /pick coin 5/i })[0]
    const chip = screen.getByRole('button', { name: /quick discard/i })
    // Touch tap: pointerenter (handoff) and the click land within the 300ms
    // guard — one tap must be one discard, not two.
    fireEvent.pointerEnter(coin)
    fireEvent.pointerLeave(coin)
    fireEvent.pointerEnter(chip)
    fireEvent.click(chip)

    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(7)
    expect(screen.getByRole('img', { name: 'Discard pile, 1 coins' })).toBeTruthy()
  })

  it('the hotspot is absent outside the play phase', () => {
    freshRun('13a6-phase')
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' }) // → buff
    expect(useRunStore.getState().handPhase).toBe('buff')
    expect(screen.queryByRole('button', { name: /quick discard/i })).toBeNull()
  })
})
