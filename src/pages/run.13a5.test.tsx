// @vitest-environment jsdom
//
// 13a.5 — drag & drop + multi-select on the run screen (UX §3, WBS 13a.5):
//   - number keys pick the nth hand coin (keyboard path to the same pickCoin)
//   - Ctrl/Cmd+A selects all (filled) coins; Esc and empty-space click clear
//   - Enter confirms a non-empty play; Space scores in the buff phase
//   - the selection never mutates the store (UX §0): selecting changes no
//     hand / play / deck state
//
// The pointer drag itself (dnd-kit) needs real pointer geometry — the
// drop→pick routing is covered by the dropTargets unit tests; here the
// keyboard + click paths that share the same store actions.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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

/** Fresh run with a drawn hand (skip the draw phase, like run.13a.test.tsx). */
function freshRun(seed: string): void {
  useRunStore.getState().startRun(seed)
  useRunStore.getState().drawHand()
  render(<RunScreen />)
}

describe('13a.5 — keyboard shortcuts', () => {
  it('number key picks the nth hand coin (same pickCoin as the click)', () => {
    freshRun('13a5-key')
    const before = useRunStore.getState()
    const slot3 = before.hand[2]
    if (slot3.kind !== 'filled') throw new Error('test precondition: hand[2] must be filled')

    fireEvent.keyDown(window, { key: '3' })

    const s = useRunStore.getState()
    expect(s.play[0].kind).toBe('filled')
    if (s.play[0].kind === 'filled') expect(s.play[0].coin.id).toBe(slot3.coin.id)
    // the coin left the hand (the play slot now owns it)
    expect(s.hand[2].kind).toBe('empty')
  })

  it('Ctrl+A selects all filled coins; Esc clears', () => {
    freshRun('13a5-ctrl-a')
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(8)
    expect(screen.getByText('8 selected')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(0)
  })

  it('selecting mutates nothing (UX §0): hand / play / deck untouched', () => {
    freshRun('13a5-pure')
    const before = useRunStore.getState()
    const snap = {
      hand: before.hand.map((s) => (s.kind === 'filled' ? s.coin.id : 'empty')),
      play: before.play.map((s) => (s.kind === 'filled' ? s.coin.id : 'empty')),
      deck: before.deck.drawPile.map((c) => c.id),
      discard: before.deck.discardPile.map((c) => c.id),
    }
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    fireEvent.keyDown(window, { key: '1', ctrlKey: true }) // toggle coin 1 off
    const after = useRunStore.getState()
    expect({
      hand: after.hand.map((s) => (s.kind === 'filled' ? s.coin.id : 'empty')),
      play: after.play.map((s) => (s.kind === 'filled' ? s.coin.id : 'empty')),
      deck: after.deck.drawPile.map((c) => c.id),
      discard: after.deck.discardPile.map((c) => c.id),
    }).toEqual(snap)
  })

  it('Enter confirms a non-empty play (toss → buff)', () => {
    freshRun('13a5-enter')
    fireEvent.keyDown(window, { key: '1' })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useRunStore.getState().handPhase).toBe('buff')
  })

  it('Space scores in the buff phase (with an Echo coin, so auto-advance waits)', { timeout: 10000 }, async () => {
    freshRun('13a5-space')
    // Force an Echo coin into the first hand slot (auto-advance must wait
    // for a re-flip decision — same pattern as run.13a.test.tsx).
    const st = useRunStore.getState()
    useRunStore.setState({
      hand: st.hand.map((s, i) =>
        i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'echo' }] } } : s,
      ),
    })
    for (let i = 1; i <= 5; i++) fireEvent.keyDown(window, { key: String(i) })
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(useRunStore.getState().handPhase).toBe('buff')

    await new Promise((r) => setTimeout(r, 1500)) // auto-advance must NOT fire
    expect(useRunStore.getState().handPhase).toBe('buff')

    fireEvent.keyDown(window, { key: ' ' })
    expect(useRunStore.getState().lastScore.some).toBe(true)
    await waitFor(() => expect(useRunStore.getState().handPhase).toBe('play'), { timeout: 8000 })
  })

  it('clicking empty space clears the selection', () => {
    freshRun('13a5-bg')
    fireEvent.keyDown(window, { key: 'a', ctrlKey: true })
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(8)
    fireEvent.click(document.querySelector('.run-screen')!)
    expect(document.querySelectorAll('.hand-coin--selected')).toHaveLength(0)
  })

  it('double-click quick-play: pick + auto-confirm when the row fills', () => {
    freshRun('13a5-dbl')
    for (const k of ['1', '2', '3', '4']) fireEvent.keyDown(window, { key: k })
    const btn = screen.getAllByRole('button', { name: /pick coin 5/i })[0]
    expect(btn).toBeTruthy()

    // A real double-click: click1 picks (the coin flies to the row), the
    // 2nd click + dblclick land on the (now empty) hand area — dispatched in
    // one act so the DOM does not re-render between them (jsdom has no
    // layout animation). The dblclick bubbles to the hand row, which
    // confirms because the last pick filled the row.
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })

    expect(useRunStore.getState().handPhase).toBe('buff')
  })

  it('double-click does NOT auto-confirm when the row is not full', () => {
    freshRun('13a5-dbl2')
    for (const k of ['1', '2']) fireEvent.keyDown(window, { key: k })
    const btn = screen.getAllByRole('button', { name: /pick coin 3/i })[0]

    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      btn.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))
    })

    // the coin was picked (3 in the row) but the hand is still 'play'
    const s = useRunStore.getState()
    expect(s.handPhase).toBe('play')
    expect(s.play.filter((p) => p.kind === 'filled')).toHaveLength(3)
  })
})
