// M4 — Hand Phase State Machine (src/state/runStore.ts).
//
// M4.1: handPhase only ever moves along draw → play → toss → buff → score → draw.
// The test records every handPhase transition the store emits and asserts each
// observed transition is the next step of the cycle.

import { describe, expect, it } from 'vitest'
import { BASE_DECK_SIZE, HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import type { HandPhase, HandSlot } from '@/core/types'
import { createRunStore } from './runStore'

/** The coin id in a slot, or -1 when the slot is empty. */
const coinId = (slot: HandSlot): number => (slot.kind === 'filled' ? slot.coin.id : -1)

/** A store with a run started and the first hand drawn (full 8-coin hand). */
function drawnStore(seed: string) {
  const store = createRunStore()
  store.getState().startRun(seed)
  store.getState().drawHand()
  return store
}

const NEXT: Record<HandPhase, HandPhase> = {
  draw: 'play',
  play: 'toss',
  toss: 'buff',
  buff: 'score',
  score: 'draw',
}

describe('M4.1 — handPhase machine', () => {
  it('only ever moves along draw → play → toss → buff → score → draw', () => {
    const store = createRunStore()
    // Record the starting phase, then every actual phase transition
    // (other actions notify without changing handPhase).
    const phases: HandPhase[] = [store.getState().handPhase]
    const unsub = store.subscribe((s, prev) => {
      if (s.handPhase !== prev.handPhase) phases.push(s.handPhase)
    })

    store.getState().startRun('m4-1')
    for (let hand = 0; hand < 2; hand++) {
      expect(store.getState().handPhase).toBe('draw')
      store.getState().drawHand()
      expect(store.getState().handPhase).toBe('play')
      const st = store.getState()
      st.pickCoin(0)
      st.confirmPlay()
      expect(store.getState().handPhase).toBe('buff')
      store.getState().score()
      expect(store.getState().handPhase).toBe('draw')
    }
    unsub()

    // Every observed transition is the next step of the cycle.
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i]).toBe(NEXT[phases[i - 1]])
    }
    // Two full cycles: start at draw, then (play → toss → buff → score → draw) ×2.
    expect(phases).toEqual([
      'draw',
      'play',
      'toss',
      'buff',
      'score',
      'draw',
      'play',
      'toss',
      'buff',
      'score',
      'draw',
    ])
  })

  it('an action fired out of its phase is a no-op', () => {
    const store = createRunStore()
    store.getState().startRun('m4-1b')

    // score() before the hand is drawn — no-op.
    store.getState().score()
    expect(store.getState().handPhase).toBe('draw')

    // drawHand() again while already in play — no-op.
    store.getState().drawHand()
    const afterFirstDraw = store.getState()
    expect(afterFirstDraw.handPhase).toBe('play')
    store.getState().drawHand()
    expect(store.getState().hand).toEqual(afterFirstDraw.hand)

    // confirmPlay() with 0 coins in the play — no-op.
    store.getState().confirmPlay()
    expect(store.getState().handPhase).toBe('play')

    // pickCoin() after the play is full (5) — no-op.
    const st = store.getState()
    st.pickCoin(0)
    st.pickCoin(1)
    st.pickCoin(2)
    st.pickCoin(3)
    st.pickCoin(4)
    const full = store.getState()
    expect(full.play.filter((s) => s.kind === 'filled')).toHaveLength(5)
    full.pickCoin(5)
    expect(store.getState().play).toEqual(full.play)
  })
})

describe('M4.2 — drawHand', () => {
  it('fills the hand with handSize face-down coins and moves to play', () => {
    const store = createRunStore()
    store.getState().startRun('m4-2')
    expect(store.getState().handPhase).toBe('draw') // auto at hand start

    store.getState().drawHand()
    const st = store.getState()

    expect(st.handPhase).toBe('play')
    expect(st.hand).toHaveLength(HAND_SIZE)
    expect(st.hand.every((s) => s.kind === 'filled')).toBe(true)
    expect(st.play).toHaveLength(PLAY_SIZE)
    expect(st.play.every((s) => s.kind === 'empty')).toBe(true)

    // handSize distinct coins from the collection; the draw pile shrinks accordingly.
    const ids = st.hand.filter((s) => s.kind === 'filled').map((s) => s.coin.id)
    expect(new Set(ids).size).toBe(HAND_SIZE)
    expect(st.deck.drawPile).toHaveLength(BASE_DECK_SIZE - HAND_SIZE)
    expect(st.deck.discardPile).toHaveLength(0)
  })

  it('draws face-down: no rng consumption (faces resolve only in the toss)', () => {
    const store = createRunStore()
    store.getState().startRun('m4-2b')
    const rngAfterStart = store.getState().rngState
    store.getState().drawHand()
    expect(store.getState().rngState).toEqual(rngAfterStart)
  })

  it('draws fewer coins when the pile is short — remaining slots stay empty', () => {
    const store = createRunStore()
    store.getState().startRun('m4-2c')
    store.setState((s) => ({ deck: { drawPile: s.deck.drawPile.slice(0, 3), discardPile: [] } }))

    store.getState().drawHand()
    const st = store.getState()

    expect(st.handPhase).toBe('play')
    expect(st.hand.map((s) => s.kind)).toEqual([
      'filled',
      'filled',
      'filled',
      'empty',
      'empty',
      'empty',
      'empty',
      'empty',
    ])
    expect(st.deck.drawPile).toHaveLength(0)
  })

  it('an empty pile at hand start auto-skips the hand (no score, handsLeft −1, stays in draw)', () => {
    const store = createRunStore()
    store.getState().startRun('m4-2d')
    store.setState({ deck: { drawPile: [], discardPile: [] } })

    store.getState().drawHand()
    const st = store.getState()

    expect(st.handPhase).toBe('draw') // auto-skipped: no play phase, back to draw
    expect(st.hand.every((s) => s.kind === 'empty')).toBe(true)
    expect(st.handsLeft).toBe(HANDS_PER_BLIND - 1)
    expect(st.blindScore).toBe(0)
  })

  it('auto-skip on the last hand ends the blind (target missed → runEnd)', () => {
    const store = createRunStore()
    store.getState().startRun('m4-2e')
    store.setState({
      deck: { drawPile: [], discardPile: [] },
      handsLeft: 1,
    })

    store.getState().drawHand()
    const st = store.getState()

    expect(st.handsLeft).toBe(0)
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(false)
  })
})

describe('M4.3 — pickCoin / unpickCoin', () => {
  it('pickCoin moves a hand coin into the next free play slot (left to right)', () => {
    const store = drawnStore('m4-3a')
    const id = coinId(store.getState().hand[2])

    store.getState().pickCoin(2)
    const st = store.getState()

    expect(coinId(st.play[0])).toBe(id)
    expect(st.hand[2].kind).toBe('empty')
    expect(st.play.slice(1).every((s) => s.kind === 'empty')).toBe(true)
  })

  it('the play fills left to right in pick order and holds up to 5', () => {
    const store = drawnStore('m4-3b')
    const ids = [0, 1, 2, 3, 4].map((i) => coinId(store.getState().hand[i]))
    for (const i of [0, 1, 2, 3, 4]) store.getState().pickCoin(i)

    expect(store.getState().play.map(coinId)).toEqual(ids)
  })

  it('picking a 6th coin is a no-op (play full)', () => {
    const store = drawnStore('m4-3c')
    for (const i of [0, 1, 2, 3, 4]) store.getState().pickCoin(i)
    const full = store.getState()

    full.pickCoin(5)
    const st = store.getState()
    expect(st.play).toEqual(full.play)
    expect(st.hand[5].kind).toBe('filled') // the coin stays in the hand
  })

  it('unpickCoin returns a play coin to the first empty hand slot', () => {
    const store = drawnStore('m4-3d')
    const id0 = coinId(store.getState().hand[0])
    const id1 = coinId(store.getState().hand[1])
    store.getState().pickCoin(0)
    store.getState().pickCoin(1)

    store.getState().unpickCoin(0)
    const st = store.getState()

    expect(coinId(st.play[0])).toBe(-1)
    expect(coinId(st.hand[0])).toBe(id0) // first empty hand slot
    expect(coinId(st.hand[1])).toBe(-1) // the coin went to hand[0], not here
    expect(coinId(st.play[1])).toBe(id1) // the other pick is untouched
  })

  it('re-picking a played coin unpicks it first (round trip)', () => {
    const store = drawnStore('m4-3e')
    const id = coinId(store.getState().hand[0])
    store.getState().pickCoin(0)
    expect(coinId(store.getState().play[0])).toBe(id)

    // "Re-pick" the played coin → it is unpicked first (back to the hand).
    store.getState().unpickCoin(0)
    const mid = store.getState()
    expect(coinId(mid.play[0])).toBe(-1)
    expect(coinId(mid.hand[0])).toBe(id)

    // …and can be picked again.
    store.getState().pickCoin(0)
    expect(coinId(store.getState().play[0])).toBe(id)
  })

  it('unpickCoin on an empty play slot is a no-op', () => {
    const store = drawnStore('m4-3f')
    const before = store.getState()

    store.getState().unpickCoin(0)
    expect(store.getState().play).toEqual(before.play)
  })

  it('pickCoin on an empty hand slot is a no-op', () => {
    const store = createRunStore()
    store.getState().startRun('m4-3g')
    store.setState((s) => ({ deck: { drawPile: s.deck.drawPile.slice(0, 3), discardPile: [] } }))
    store.getState().drawHand()
    const before = store.getState()
    expect(coinId(before.hand[3])).toBe(-1)

    store.getState().pickCoin(3)
    expect(store.getState().play).toEqual(before.play)
  })
})

describe('M4.4 — discard', () => {
  it('a plain coin goes to the discard pile (gone for the blind)', () => {
    const store = drawnStore('m4-4a')
    const st = store.getState()
    const id = coinId(st.hand[0])
    const drawPileBefore = st.deck.drawPile.length

    store.getState().discard(0)
    const after = store.getState()

    expect(after.hand[0].kind).toBe('empty')
    expect(after.deck.discardPile.map((c) => c.id)).toContain(id)
    expect(after.deck.drawPile).toHaveLength(drawPileBefore) // draw pile untouched
    expect(after.deck.drawPile.some((c) => c.id === id)).toBe(false) // gone for the blind
  })

  it('discard is unlimited — several coins in one play phase', () => {
    const store = drawnStore('m4-4b')
    const ids = [0, 1, 2].map((i) => coinId(store.getState().hand[i]))

    store.getState().discard(0)
    store.getState().discard(1)
    store.getState().discard(2)
    const after = store.getState()

    expect([0, 1, 2].map((i) => after.hand[i].kind)).toEqual(['empty', 'empty', 'empty'])
    expect(after.deck.discardPile.map((c) => c.id)).toEqual(expect.arrayContaining(ids))
  })

  // Where each redraw lands: a full 8-coin hand with the draw coin at hand[0],
  // two plain coins (hand[1], hand[2]) discarded first, then the draw coin.
  // Empty slots after the discards: 0, 1, 2 → discarded slot first, then left to right.
  const REFILLED: Record<number, number[]> = { 1: [0], 2: [0, 1], 3: [0, 1, 2] }

  it.each([1, 2, 3] as const)(
    'a draw-%d coin redraws fresh face-down coins (discarded slot first, then left to right)',
    (count) => {
      const store = createRunStore()
      store.getState().startRun(`m4-4d${count}`)
      store.getState().drawHand()
      const st = store.getState()
      const id1 = coinId(st.hand[1])
      const id2 = coinId(st.hand[2])
      // Inject a draw-N coin into hand[0] (the base collection is all plain coins).
      store.setState((s) => ({
        hand: s.hand.map((slot, i) =>
          i === 0 ? { kind: 'filled', coin: { id: 900, effects: [{ kind: 'draw', count }] }, face: 'H', echoUsed: false } : slot,
        ),
      }))

      store.getState().discard(1) // plain → gone, slot 1 empty
      store.getState().discard(2) // plain → gone, slot 2 empty
      store.getState().discard(0) // draw-N → gone, redraw N
      const after = store.getState()

      for (const i of REFILLED[count]) {
        expect(after.hand[i].kind).toBe('filled')
        expect(coinId(after.hand[i])).not.toBe(900)
      }
      expect(after.hand.filter((s) => s.kind === 'filled')).toHaveLength(5 + count)
      expect(after.deck.discardPile.map((c) => c.id)).toEqual([id1, id2, 900])
      expect(after.deck.drawPile).toHaveLength(BASE_DECK_SIZE - HAND_SIZE - count)
    },
  )

  it('redraws are capped by the empty hand slots (full hand + draw2 → 1 redraw)', () => {
    const store = createRunStore()
    store.getState().startRun('m4-4e')
    store.setState((s) => ({
      deck: {
        drawPile: [
          { id: 900, effects: [{ kind: 'draw', count: 2 }] },
          ...s.deck.drawPile.slice(0, 9),
        ],
        discardPile: [],
      },
    }))
    store.getState().drawHand() // full 8-coin hand, 900 at hand[0], pile = 2

    store.getState().discard(0)
    const after = store.getState()

    expect(after.hand.filter((s) => s.kind === 'filled')).toHaveLength(8) // only 1 redraw fits
    expect(coinId(after.hand[0])).not.toBe(900)
    expect(after.deck.drawPile).toHaveLength(1) // the 2nd redraw has no slot — stays in the pile
  })

  it('a draw3 coin redraws fewer when the draw pile is short', () => {
    const store = createRunStore()
    store.getState().startRun('m4-4f')
    store.getState().drawHand()
    // Inject a draw-3 coin into hand[0] and leave only 2 coins in the draw pile.
    store.setState((s) => ({
      hand: s.hand.map((slot, i) =>
        i === 0 ? { kind: 'filled', coin: { id: 900, effects: [{ kind: 'draw', count: 3 }] }, face: 'H', echoUsed: false } : slot,
      ),
      deck: { drawPile: s.deck.drawPile.slice(0, 2), discardPile: [] },
    }))

    store.getState().discard(1) // slot 1 empty
    store.getState().discard(2) // slot 2 empty
    store.getState().discard(0) // draw-3 → only 2 coins left in the pile
    const after = store.getState()

    // 2 redraws (slots 0, 1); slot 2 stays empty — the pile ran out.
    expect(after.hand[0].kind).toBe('filled')
    expect(after.hand[1].kind).toBe('filled')
    expect(after.hand[2].kind).toBe('empty')
    expect(after.hand.filter((s) => s.kind === 'filled')).toHaveLength(7)
    expect(after.deck.drawPile).toHaveLength(0)
  })
})
