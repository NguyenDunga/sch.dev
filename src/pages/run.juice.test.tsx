// @vitest-environment jsdom
//
// 13.1 — deal/pick/discard motion (integration, jsdom):
//   - the deck + discard well render the draw/discard pile counts
//   - discarding a coin spawns a ghost that flies to the well (portaled to
//     <body>) and removes itself when the flight completes; the coin moves
//     to the discard pile in the store
//
// The deal flight and the pick/unpick springs are framer-motion transforms
// (not assertable in jsdom); the deal *detection* is unit-tested in
// deal.test.ts.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

describe('13.1 — run screen piles + discard ghost', () => {
  beforeAll(() => {
    // Same localStorage stub as the smoke suite (see screens.smoke.test.tsx).
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  afterEach(() => {
    cleanup()
  })

  it('the deck and discard well render the pile counts', () => {
    useRunStore.getState().startRun('juice-piles')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    // 80-coin base deck, 8 drawn → 72 left; nothing discarded yet.
    expect(screen.getByRole('img', { name: 'Draw pile, 72 coins' })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'Discard pile, 0 coins' })).toBeTruthy()
  })

  it('discarding a coin spawns a ghost and moves the coin to the discard pile', async () => {
    useRunStore.getState().startRun('juice-discard')
    useRunStore.getState().drawHand()
    render(<RunScreen />)

    // Enter discard mode, then tap the first hand coin.
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])

    // The coin left the hand; the discard pile grew.
    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(7)
    expect(screen.getByRole('img', { name: 'Discard pile, 1 coins' })).toBeTruthy()

    // A ghost is in flight (portaled to <body>) and removes itself when the
    // 180ms flight completes.
    expect(document.querySelector('.discard-ghost')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('.discard-ghost')).toBeNull(), { timeout: 2000 })
  })

  it('a discarded draw-enchant coin redraws and the redrawn coin is dealt', async () => {
    // Force a Draw-2 coin into the first hand slot (presentational test —
    // the store logic is covered in handFlow.test.ts).
    useRunStore.getState().startRun('juice-redraw')
    useRunStore.getState().drawHand()
    const hand = useRunStore.getState().hand
    const first = hand.find((s) => s.kind === 'filled')
    expect(first).toBeTruthy()
    useRunStore.setState({
      hand: hand.map((s, i) =>
        i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'draw', count: 2 }] } } : s,
      ),
    })
    render(<RunScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])

    // The Draw-2 coin is gone; a full hand has one empty slot, so only one
    // of the two redraws lands (the store logic is covered in handFlow.test):
    // 80 − 8 dealt − 1 redraw = 71 left in the draw pile.
    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(8)
    expect(screen.getByRole('img', { name: 'Draw pile, 71 coins' })).toBeTruthy()
    // The redrawn coins fly in from the deck (the ghost of the discarded
    // coin is still in flight).
    await waitFor(() => expect(document.querySelector('.discard-ghost')).toBeNull(), { timeout: 2000 })
  })
})
