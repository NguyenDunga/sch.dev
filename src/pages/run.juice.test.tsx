// @vitest-environment jsdom
//
// 13.1 — deal/pick/discard motion (integration, jsdom):
//   - the deck + discard well render the draw/discard pile counts
//   - discarding a coin spawns a ghost that flies to the well (portaled to
//     <body>) and removes itself when the flight completes; the coin moves
//     to the discard pile in the store
// 13.2 — toss + echo (integration, jsdom):
//   - confirmPlay reveals a toss coin per picked coin, each landing on the
//     store-resolved face (Slot.face)
//   - an Echo re-flip re-tosses the single coin (remount) on its new face
//
// The deal flight, pick/unpick springs, and the toss arc/tumble are
// framer-motion transforms (not assertable in jsdom); the deal *detection*
// is unit-tested in deal.test.ts and the toss *landing face* in
// toss-coin.test.tsx.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'

afterEach(() => {
  cleanup()
})

describe('13.1 — run screen piles + discard ghost', () => {
  beforeAll(() => {
    // Same localStorage stub as the smoke suite (see screens.smoke.test.tsx).
    vi.stubGlobal('localStorage', makeLocalStorage())
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

describe('13.2 — toss + echo (lands on Slot.face)', () => {
  it('confirmPlay reveals a toss coin per picked coin, each on the store-resolved face', () => {
    useRunStore.getState().startRun('juice-toss')
    useRunStore.getState().drawHand()
    render(<RunScreen />)

    // Pick 5 coins, then confirm (play → toss → buff, synchronous in the
    // store — the UI observes 'buff' and renders the revealed coins).
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
    }
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    const { play } = useRunStore.getState()
    expect(play.filter((s) => s.kind === 'filled')).toHaveLength(5)
    // The 5 toss coins (role=img, labelled heads/tails) in play-row order.
    const flips = screen.getAllByRole('img', { name: /^(heads|tails)$/ })
    expect(flips).toHaveLength(5)
    play.forEach((slot, i) => {
      if (slot.kind !== 'filled') return
      expect(flips[i].getAttribute('aria-label')).toBe(slot.face === 'H' ? 'heads' : 'tails')
    })
  })

  it('an Echo re-flip re-tosses the single coin on its (new) face', () => {
    useRunStore.getState().startRun('juice-echo')
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

    // Pick the Echo coin, confirm → buff (a re-flip is now available).
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    const reflip = screen.getByRole('button', { name: 're-flip slot 1' })
    const before = reflip.querySelector('.toss-coin')
    fireEvent.click(reflip)

    // The coin re-mounts (key change: face + echoUsed) and lands on the
    // store-resolved face — the re-toss, not a face swap. The echo is now
    // used, so the slot renders a plain toss coin (no re-flip button).
    const slot = useRunStore.getState().play[0]
    expect(slot.kind).toBe('filled')
    const after = document.querySelector('.play-row .toss-coin')
    expect(after).not.toBe(before)
    if (slot.kind === 'filled') {
      expect(slot.echoUsed).toBe(true)
      expect(after?.querySelector('.toss-coin-flip')?.getAttribute('aria-label')).toBe(
        slot.face === 'H' ? 'heads' : 'tails',
      )
    }
  })
})
