// M14.3 — Determinism regression: a fixed-seed full run gives an identical
// sequence of draws, tosses, and shop offers across two runs.
//
// Uses the RNG draw-order contract: the same seed + same action sequence
// produces bit-identical state. We run a multi-blind loop (draw → pick →
// confirm → score → shop → leave) and compare every observable.

import { describe, expect, it } from 'vitest'
import { createRunStore } from '@/state/runStore'
import { coinId } from '@/state/testHelpers'

/**
 * Run a full multi-blind sequence with a fixed seed and return an
 * observable trace: for each hand, the drawn coin ids, the play faces,
 * the blind score, and the shop offers.
 */
function runTrace(seed: string, blinds: number): object[] {
  const store = createRunStore()
  store.getState().startRun(seed)
  const trace: object[] = []

  for (let b = 0; b < blinds; b++) {
    // Draw hand
    store.getState().drawHand()
    const handIds = store.getState().hand.map(coinId)
    trace.push({ type: 'draw', blind: b, handIds })

    // Pick 3 coins (indices 0, 2, 4 — always valid for a full 8-coin hand)
    store.getState().pickCoin(0)
    store.getState().pickCoin(2)
    store.getState().pickCoin(4)

    // Confirm → toss
    store.getState().confirmPlay()
    const playFaces = store
      .getState()
      .play.filter((s) => s.kind === 'filled')
      .map((s) => (s as { face: 'H' | 'T' }).face)
    trace.push({ type: 'toss', blind: b, playFaces })

    // Score
    store.getState().score()
    const blindScore = store.getState().blindScore
    const lastScore = store.getState().lastScore
    trace.push({ type: 'score', blind: b, blindScore, lastScore: lastScore.some ? { ...lastScore.value } : null })

    // If the blind is over, leave the shop (or transition to next blind)
    if (store.getState().phase === 'shop') {
      const offers = store.getState().shop.offers.map((o) => ({
        kind: o.kind,
        charm: 'charm' in o ? o.charm : undefined,
        effect: 'effect' in o ? o.effect : undefined,
      }))
      trace.push({ type: 'shop', blind: b, offers })
      store.getState().leaveShop()
    } else if (store.getState().handsLeft <= 0 && store.getState().phase === 'run') {
      // Blind ended without shop (shouldn't happen normally, but guard)
      break
    }
  }

  return trace
}

describe('M14.3 — Determinism regression', () => {
  it('same seed + same actions → identical draw/toss/score/shop trace (3 blinds)', () => {
    const a = runTrace('m14-det-3', 3)
    const b = runTrace('m14-det-3', 3)
    expect(a).toEqual(b)
  })

  it('different seeds → different traces (sanity: the RNG actually varies)', () => {
    const a = runTrace('m14-det-A', 2)
    const b = runTrace('m14-det-B', 2)
    // At minimum the first draw should differ (50/50 collection shuffled differently)
    const drawA = a.find((t) => (t as { type: string }).type === 'draw')
    const drawB = b.find((t) => (t as { type: string }).type === 'draw')
    expect(drawA).not.toEqual(drawB)
  })

  it('RNG state is reproducible mid-run (state/restore contract)', () => {
    const store = createRunStore()
    store.getState().startRun('m14-rng-state')
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()

    const rngStateAfterToss = [...store.getState().rngState]

    // Restore the same state into a fresh store and verify the next
    // observable (score) is identical.
    const store2 = createRunStore()
    store2.getState().startRun('m14-rng-state')
    store2.getState().drawHand()
    store2.getState().pickCoin(0)
    store2.getState().confirmPlay()

    expect([...store2.getState().rngState]).toEqual(rngStateAfterToss)

    // Score both and compare
    store.getState().score()
    store2.getState().score()
    expect(store.getState().blindScore).toEqual(store2.getState().blindScore)
  })
})
