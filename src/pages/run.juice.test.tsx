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
import type { Face } from '@/core/types'
import { some } from '@/core/helpers'

/**
 * A matchMedia stub for framer's useReducedMotion (installed at module
 * level, before any render, so framer's one-time read sees it): motion-dom
 * reads `window.matchMedia("(prefers-reduced-motion)")` once and subscribes
 * to its `change` events; `setReduced` flips the preference (the 13.3
 * reduced-motion test) and resets after each test.
 */
const reduced = (() => {
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    onchange: null,
    addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
    addListener: (fn: () => void) => listeners.push(fn),
    removeListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
    dispatchEvent: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    setReduced: (r: boolean) => {
      mql.matches = r
      listeners.forEach((fn) => fn())
    },
  }
})()

afterEach(() => {
  cleanup()
  reduced.setReduced(false)
})

/** Observe <body> (the choreo overlay is portaled there) for the given
 *  selector; collects the class names that ever appeared while observing. */
function observeFlights(selector: string): { seen: string[]; stop: () => void } {
  const seen: string[] = []
  const mo = new MutationObserver(() => {
    document.querySelectorAll(selector).forEach((el) => {
      const c = el.className
      if (!seen.includes(c)) seen.push(c)
    })
  })
  mo.observe(document.body, { childList: true, subtree: true })
  return {
    seen,
    stop: () => mo.disconnect(),
  }
}

describe('13.1 — run screen piles + discard ghost', () => {
  beforeAll(() => {
    // Same localStorage stub as the smoke suite (see screens.smoke.test.tsx).
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  it('the deck and discard well render the pile counts', () => {
    useRunStore.getState().startRun('juice-piles')
    useRunStore.getState().drawHand()
    render(<RunScreen />)
    // 24-coin base deck (m13a), 8 drawn → 16 left; nothing discarded yet.
    expect(screen.getByRole('img', { name: 'Draw pile, 16 coins' })).toBeTruthy()
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
    // 24 − 8 dealt − 1 redraw = 15 left in the draw pile (m13a deck).
    expect(screen.getAllByRole('button', { name: /pick coin/i })).toHaveLength(8)
    expect(screen.getByRole('img', { name: 'Draw pile, 15 coins' })).toBeTruthy()
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

/** A run with 4 coins picked, confirmed, and the play faces forced to
 *  HHHH (fourRow: 40 × 3 = 120, no coin cash). */
function fourRowRun(seed: string) {
  useRunStore.getState().startRun(seed)
  useRunStore.getState().drawHand()
  render(<RunScreen />)
  for (let i = 0; i < 4; i++) {
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
  }
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
  const { play } = useRunStore.getState()
  useRunStore.setState({ play: play.map((s) => (s.kind === 'filled' ? { ...s, face: 'H' as const } : s)) })
}

/** A run with 2 coins picked (HT → no tier) and a forced Tax coin in the
 *  first slot (pays $1 cash on score). */
function noTierTaxRun(seed: string) {
  useRunStore.getState().startRun(seed)
  useRunStore.getState().drawHand()
  render(<RunScreen />)
  const hand = useRunStore.getState().hand
  useRunStore.setState({
    hand: hand.map((s, i) =>
      i === 0 && s.kind === 'filled' ? { ...s, coin: { ...s.coin, effects: [{ kind: 'tax' as const }] } } : s,
    ),
  })
  fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
  fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
  fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
  const { play } = useRunStore.getState()
  useRunStore.setState({
    play: play.map((s, i) => (s.kind === 'filled' ? { ...s, face: (i === 0 ? 'H' : 'T') as Face } : s)),
  })
}

describe('13.3 — scoring choreography (the 7 beats)', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  it('Score plays the sequence to the end: banner, chip flights, ticker settles on the store numbers', async () => {
    fourRowRun('juice-choro')
    const flights = observeFlights('.choreo-chip')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))

    // Beat 2: the tier banner slams in with the tier name.
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    // The sequence runs to the end (≤ ~2.4s budget): the overlay is gone
    // and the ticker rests on the store's numbers.
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull(), { timeout: 5000 })
    flights.stop()
    expect(flights.seen.length).toBeGreaterThan(0) // the matched chips flew
    expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120')

    // The numbers come from the store (juice never mutates state, UX §0).
    const { lastScore, blindScore } = useRunStore.getState()
    expect(blindScore).toBe(120)
    expect(lastScore).toEqual(
      some({ kind: 'scored', tier: 'fourRow', chips: 40, mult: 3, total: 120, cash: 0 }),
    )
  })

  it('a tap during the sequence skips to the settled end; no number changes', async () => {
    fourRowRun('juice-skip')
    const cashBefore = useRunStore.getState().cash
    fireEvent.click(screen.getByRole('button', { name: /score/i }))

    // Wait for the banner (beat 2), then tap anywhere → skip to the end.
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.pointerDown(document.body)

    // Snapped: the overlay is gone and the ticker shows the final numbers
    // instantly (no count-up left to play).
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    await waitFor(() => expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120'))

    // No number changes: the store numbers are exactly what score() set —
    // the same values the full-sequence test settles on.
    const { lastScore, blindScore, cash } = useRunStore.getState()
    expect(blindScore).toBe(120)
    expect(cash).toBe(cashBefore)
    expect(lastScore).toEqual(
      some({ kind: 'scored', tier: 'fourRow', chips: 40, mult: 3, total: 120, cash: 0 }),
    )
  })

  it('a no-tier hand plays the "No match" banner and the cash lands', async () => {
    noTierTaxRun('juice-nomatch')
    const cashBefore = useRunStore.getState().cash
    fireEvent.click(screen.getByRole('button', { name: /score/i }))

    // The "No match" banner (not a tier slam) and the cash landing.
    await waitFor(() => expect(screen.getByText('No match')).toBeTruthy())
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull(), { timeout: 5000 })
    expect(document.querySelector('.score-ticker-cash')?.textContent).toBe('+$1 cash')
    expect(useRunStore.getState().cash).toBe(cashBefore + 1)
  })

  it('reduced motion: fast beats, no flights (UX §8)', async () => {
    reduced.setReduced(true)
    fourRowRun('juice-reduced')
    const flights = observeFlights('.choreo-chip, .choreo-cash-coin')
    const t0 = Date.now()
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull(), { timeout: 2000 })
    flights.stop()
    // The reduced budget is ~1s (vs ~2.2s with motion).
    expect(Date.now() - t0).toBeLessThan(1500)
    // No chip/cash flights in reduced motion.
    expect(flights.seen).toEqual([])
    expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120')
  })
})

describe('13.4 — skip / fast-forward (no number changes)', () => {
  beforeAll(() => {
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  /** The store numbers a skip must never change (UX §0/§6): everything the
   *  Score tap already settled + the run's bookkeeping (skip is purely
   *  presentational — it calls no store action). */
  function settledNumbers() {
    const s = useRunStore.getState()
    return {
      blindScore: s.blindScore,
      runScore: s.runScore,
      cash: s.cash,
      handsLeft: s.handsLeft,
      round: s.round,
      blindIndex: s.blindIndex,
      lastScore: s.lastScore,
      won: s.won,
      phase: s.phase,
      handPhase: s.handPhase,
      hand: s.hand,
      play: s.play,
      charms: s.charms,
      deck: s.deck,
      rngState: s.rngState,
    }
  }

  it('a key during the sequence skips to the settled end; no number changes', async () => {
    fourRowRun('juice-134-key')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.keyDown(document.body, { key: 'Enter' })

    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    await waitFor(() => expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120'))
    const { lastScore, blindScore } = useRunStore.getState()
    expect(blindScore).toBe(120)
    expect(lastScore).toEqual(
      some({ kind: 'scored', tier: 'fourRow', chips: 40, mult: 3, total: 120, cash: 0 }),
    )
  })

  it('a skip changes no number vs. letting the sequence play out', async () => {
    // Run A: the same hand (same seed → same deck), let the sequence play
    // out to the end.
    fourRowRun('juice-134')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull(), { timeout: 5000 })
    const full = settledNumbers()
    cleanup()

    // Run B: the same hand, skipped at the banner.
    fourRowRun('juice-134')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    const skipped = settledNumbers()

    // The settled end is the same state either way (UX §6: "a second tap
    // during the sequence fast-forwards to step 7 instantly" — no number
    // changes, UX §0).
    expect(skipped).toEqual(full)
  })

  it('a tap right after the Score tap fast-forwards from beat 1', async () => {
    fourRowRun('juice-134-early')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    // No wait: skip before the banner even slams in.
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    await waitFor(() => expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120'))
    expect(useRunStore.getState().blindScore).toBe(120)
  })

  it('repeated taps/keys during the sequence are idempotent (fast-forward spam)', async () => {
    fourRowRun('juice-134-spam')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.pointerDown(document.body)
    fireEvent.pointerDown(document.body)
    fireEvent.keyDown(document.body, { key: ' ' })
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120')
    expect(useRunStore.getState().blindScore).toBe(120)
  })

  it('a tap after the sequence ends changes nothing', async () => {
    fourRowRun('juice-134-late')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull(), { timeout: 5000 })
    const before = settledNumbers()
    fireEvent.pointerDown(document.body)
    // Still settled: no overlay, same numbers.
    expect(document.querySelector('.choreo-layer')).toBeNull()
    expect(settledNumbers()).toEqual(before)
  })

  it('skipping a cash hand counts the cash exactly once', async () => {
    noTierTaxRun('juice-134-cash')
    const cashBefore = useRunStore.getState().cash
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('No match')).toBeTruthy())
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    // The tax cash was counted by score() before the sequence started — the
    // skip neither loses it nor double-counts it.
    expect(useRunStore.getState().cash).toBe(cashBefore + 1)
    expect(document.querySelector('.score-ticker-cash')?.textContent).toBe('+$1 cash')
  })

  it('a skip never blocks input: the next hand is playable right away', async () => {
    fourRowRun('juice-134-input')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    // The auto-drawn hand is in the play phase: a pick works immediately
    // (UX §9 — choreography must never block input).
    const playBefore = useRunStore.getState().play
    fireEvent.click(screen.getAllByRole('button', { name: /pick coin/i })[0])
    expect(useRunStore.getState().play).not.toEqual(playBefore)
  })

  it('skip works under reduced motion (fast beats)', async () => {
    reduced.setReduced(true)
    fourRowRun('juice-134-reduced')
    fireEvent.click(screen.getByRole('button', { name: /score/i }))
    await waitFor(() => expect(screen.getByText('4-IN-A-ROW')).toBeTruthy())
    fireEvent.pointerDown(document.body)
    await waitFor(() => expect(document.querySelector('.choreo-layer')).toBeNull())
    expect(document.querySelector('.score-ticker-math')?.textContent).toBe('40 × 3 = 120')
    expect(useRunStore.getState().blindScore).toBe(120)
  })
})
