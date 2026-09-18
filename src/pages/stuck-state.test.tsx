// @vitest-environment jsdom
//
// Stuck-state regressions (player reports: "stuck on 0 hand / 0 deck" and a
// frozen run screen, seed 5fgCJHSu): the rendered run screen must end the
// run — never strand — when the hand is dead (0 hand / 0 play / 0 deck), and
// it must survive a duplicate-id hand without a render loop ("Too many
// re-renders" unmounted the tree → frozen screen).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import { emptyHand } from '@/core/helpers'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import App from '../App'

const mql = {
  matches: true,
  media: '(prefers-reduced-motion)',
  addEventListener: () => {},
  removeEventListener: () => {},
}
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

let errors: string[] = []

/** Framer's one-off reduced-motion notice (the test stub forces reduced
 *  motion) — benign, not a bug. */
const BENIGN = /Reduced Motion enabled on your device/

describe('stuck-state regression — 0 hand / 0 deck ends the run', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
    errors = []
    vi.spyOn(console, 'error').mockImplementation((...args) => {
      const msg = args.map(String).join(' ')
      if (!BENIGN.test(msg)) errors.push(msg)
    })
    vi.spyOn(console, 'warn').mockImplementation((...args) => {
      const msg = args.map(String).join(' ')
      if (!BENIGN.test(msg)) errors.push(msg)
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('play phase: discarding the last hand coin (empty play + empty pile) lands on the run-end screen', async () => {
    const store = useRunStore
    store.getState().startRun('stuck-play')
    store.setState({
      hand: emptyHand(HAND_SIZE).map((slot, i) =>
        i === 0 ? { kind: 'filled' as const, coin: { id: 990, effects: [] }, face: 'H', echoUsed: false } : slot,
      ),
      play: emptyHand(PLAY_SIZE),
      deck: { drawPile: [], discardPile: [] },
      handPhase: 'play' as const,
    })
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    expect(store.getState().handPhase).toBe('play')

    // The player's discard (well drop / D key both call store.discard).
    store.getState().discard(0)

    const st = store.getState()
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(false)
    expect(st.handsLeft).toBe(HANDS_PER_BLIND - 1)
    // The screen transitioned to the game-over view (the AnimatePresence
    // exit can take a frame — wait for it).
    await waitFor(() => expect(screen.getByText('Game over')).toBeTruthy())
    expect(errors).toEqual([])
  })

  it('draw phase: empty pile + empty hand lands on the run-end screen', async () => {
    const store = useRunStore
    store.getState().startRun('stuck-draw')
    store.setState({
      hand: emptyHand(HAND_SIZE),
      play: emptyHand(PLAY_SIZE),
      handPhase: 'draw',
      deck: { drawPile: [], discardPile: [] },
    })
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    // The auto-draw effect fires on mount; the dead blind ends the run.
    const st = store.getState()
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(false)
    await waitFor(() => expect(screen.getByText('Game over')).toBeTruthy())
    expect(errors).toEqual([])
  })

  // The player's actual freeze (2026-07-22, seed 5fgCJHSu): a pre-fix shop
  // purchase could collide with a keep-unplayed hand coin's id, and a hand
  // holding both duplicates looped the render-phase deal detection
  // ("Too many re-renders" → React unmounted the tree → frozen screen).
  // The store now guarantees unique ids; this proves the UI also survives a
  // duplicate-id hand (defense in depth — sameIds set equality).
  it('a hand holding two coins with the same id renders without a render loop', () => {
    const store = useRunStore
    store.getState().startRun('stuck-dup')
    store.setState({
      hand: emptyHand(HAND_SIZE).map((slot, i) =>
        i === 0 || i === 1
          ? { kind: 'filled' as const, coin: { id: 7, effects: [] }, face: 'H', echoUsed: false }
          : slot,
      ),
      play: emptyHand(PLAY_SIZE),
      handPhase: 'play' as const,
      deck: { drawPile: [], discardPile: [] },
    })
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
    // The screen is up and interactive (no "Too many re-renders" crash).
    expect(screen.getByText('Confirm')).toBeTruthy()
    expect(store.getState().handPhase).toBe('play')
    // The only console noise is React's duplicate-key WARNING (a symptom of
    // the injected legacy state, not a crash) — real play can no longer
    // produce duplicate ids, and legacy saves are unique-ified on resume.
    expect(errors.every((e) => e.includes('two children with the same key'))).toBe(true)
    expect(errors.length).toBeGreaterThan(0)
  })
})
