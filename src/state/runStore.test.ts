// M4 — Hand Phase State Machine (src/state/runStore.ts).
//
// M4.1: handPhase only ever moves along draw → play → toss → buff → score → draw.
// The test records every handPhase transition the store emits and asserts each
// observed transition is the next step of the cycle.

import { describe, expect, it } from 'vitest'
import { BASE_DECK_SIZE, HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import { buildCollection, shuffleCollection } from '@/core/deck'
import { none, some } from '@/core/helpers'
import { createRng } from '@/core/rng'
import { resolveFace } from '@/core/scoring'
import type { Coin, Face, HandPhase, HandSlot, Option } from '@/core/types'
import { createRunStore, type RunStore } from './runStore'

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

describe('M4.5 — confirmPlay', () => {
  it('requires ≥1 picked coin — an empty play is a no-op', () => {
    const store = drawnStore('m4-5a')
    const before = store.getState()
    const rngBefore = before.rngState

    store.getState().confirmPlay()
    const after = store.getState()

    expect(after.handPhase).toBe('play')
    expect(after.play).toEqual(before.play)
    expect(after.rngState).toEqual(rngBefore) // no face resolution ran
  })

  it('moves play → toss → buff (buff is the resting phase)', () => {
    const store = drawnStore('m4-5b')
    store.getState().pickCoin(0)

    store.getState().confirmPlay()
    expect(store.getState().handPhase).toBe('buff')
  })

  it('unpicked hand coins stay in the hand (not discarded yet)', () => {
    const store = drawnStore('m4-5c')
    store.getState().pickCoin(0)
    store.getState().pickCoin(1)

    store.getState().confirmPlay()
    const after = store.getState()

    // 6 of 8 hand coins remain, still in the hand.
    expect(after.hand.filter((s) => s.kind === 'filled')).toHaveLength(HAND_SIZE - 2)
    // Nothing has been discarded yet — that happens at score.
    expect(after.deck.discardPile).toHaveLength(0)
  })

  it('resolves the picked coins faces in the toss (rng consumed, valid faces)', () => {
    const store = drawnStore('m4-5d')
    store.getState().pickCoin(0)
    store.getState().pickCoin(2)
    const rngBefore = store.getState().rngState

    store.getState().confirmPlay()
    const after = store.getState()

    expect(after.rngState).not.toEqual(rngBefore)
    for (const slot of after.play) {
      if (slot.kind === 'filled') {
        expect(['H', 'T']).toContain(slot.face)
      }
    }
  })
})

describe('M4.6 — toss (auto on confirmPlay)', () => {
  it('sets a face on every picked coin; empty play slots stay empty', () => {
    const store = drawnStore('m4-6a')
    store.getState().pickCoin(0)
    store.getState().pickCoin(3)

    store.getState().confirmPlay()
    const st = store.getState()

    expect(st.play[0].kind).toBe('filled')
    expect(st.play[1].kind).toBe('filled')
    expect(['H', 'T']).toContain(st.play[0].face)
    expect(['H', 'T']).toContain(st.play[1].face)
    expect(st.play.slice(2).every((s) => s.kind === 'empty')).toBe(true)
  })

  it('resolves faces in play order with exactly one roll per picked coin (golden sequence)', () => {
    const seed = 'm4-6b'
    const store = createRunStore()
    store.getState().startRun(seed)
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().pickCoin(2)
    store.getState().pickCoin(5)
    store.getState().confirmPlay()
    const st = store.getState()
    const faces = st.play.map((s) => (s.kind === 'filled' ? s.face : null))

    // Reference: the RNG draw-order contract (SDD Data Design) —
    // 1. blind-start shuffle, 2. per-hand draw (no rng), 4. per-slot toss in play order.
    const rng = createRng(seed)
    const deck = shuffleCollection(rng, buildCollection())
    const hand = deck.drawPile.slice(0, HAND_SIZE)
    const picked = [hand[0], hand[2], hand[5]]
    const expected: Face[] = []
    picked.forEach((coin, i) => {
      const left: Option<Face> = i > 0 ? some(expected[i - 1]) : none
      expected.push(resolveFace(rng, coin, left))
    })

    expect(faces.slice(0, picked.length)).toEqual(expected)
    // Exactly shuffle + 3 face rolls — hand coins are never resolved in the toss.
    expect(st.rngState).toEqual(rng.state())
  })

  it('same seed + same picks → identical faces (determinism)', () => {
    const run = (seed: string) => {
      const store = createRunStore()
      store.getState().startRun(seed)
      store.getState().drawHand()
      store.getState().pickCoin(1)
      store.getState().pickCoin(4)
      store.getState().confirmPlay()
      return store.getState().play.map((s) => (s.kind === 'filled' ? s.face : null))
    }
    expect(run('m4-6c')).toEqual(run('m4-6c'))
  })
})

describe('M4.7 — echoReflip', () => {
  /** Replace a hand slot with a specific coin (the base collection is all plain). */
  const setHandCoin = (store: ReturnType<typeof createRunStore>, index: number, coin: Coin) =>
    store.setState((s) => ({
      hand: s.hand.map((slot, i) =>
        i === index ? { kind: 'filled', coin, face: 'H', echoUsed: false } : slot,
      ),
    }))

  const ECHO: Coin = { id: 910, effects: [{ kind: 'echo' }] }

  it('re-resolves an Echo coin face once and sets echoUsed', () => {
    const store = drawnStore('m4-7a')
    setHandCoin(store, 0, ECHO)
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    const before = store.getState()
    expect(before.play[0].echoUsed).toBe(false)
    const rngBefore = before.rngState

    store.getState().echoReflip(0)
    const after = store.getState()

    expect(after.play[0].echoUsed).toBe(true)
    expect(after.rngState).not.toEqual(rngBefore) // the re-flip rolled the rng
    expect(['H', 'T']).toContain(after.play[0].face)
  })

  it('a second call on the same slot is a no-op', () => {
    const store = drawnStore('m4-7b')
    setHandCoin(store, 0, ECHO)
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().echoReflip(0)
    const mid = store.getState()

    store.getState().echoReflip(0)
    const after = store.getState()

    expect(after.play[0].face).toBe(mid.play[0].face)
    expect(after.rngState).toEqual(mid.rngState)
    expect(after.play[0].echoUsed).toBe(true)
  })

  it('a non-Echo coin cannot be re-flipped', () => {
    const store = drawnStore('m4-7c')
    store.getState().pickCoin(1) // plain coin → play[0]
    store.getState().confirmPlay()
    const before = store.getState()

    store.getState().echoReflip(0)
    const after = store.getState()

    expect(after.play[0].face).toBe(before.play[0].face)
    expect(after.rngState).toEqual(before.rngState)
    expect(after.play[0].echoUsed).toBe(false)
  })

  it('each Echo coin gets its own single re-flip (independent echoUsed flags)', () => {
    const store = drawnStore('m4-7d')
    setHandCoin(store, 0, ECHO)
    setHandCoin(store, 1, { id: 911, effects: [{ kind: 'echo' }] })
    store.getState().pickCoin(0)
    store.getState().pickCoin(1)
    store.getState().confirmPlay()

    store.getState().echoReflip(0)
    const mid = store.getState()
    expect(mid.play[0].echoUsed).toBe(true)
    expect(mid.play[1].echoUsed).toBe(false) // the other coin is untouched

    store.getState().echoReflip(1)
    const after = store.getState()
    expect(after.play[1].echoUsed).toBe(true)
    // …and the first one stays used (no second re-flip on it).
    after.echoReflip(0)
    expect(store.getState().play[0].face).toBe(after.play[0].face)
  })

  it('echoReflip out of the buff phase is a no-op', () => {
    const store = drawnStore('m4-7e') // play phase
    setHandCoin(store, 0, ECHO)
    store.getState().pickCoin(0)
    const before = store.getState()

    store.getState().echoReflip(0)
    const after = store.getState()

    expect(after.handPhase).toBe('play')
    expect(after.play[0].echoUsed).toBe(false)
    expect(after.rngState).toEqual(before.rngState)
  })
})

describe('M4.8 — score', () => {
  it('moves ALL hand coins (tossed + unpicked) to the discard pile', () => {
    const store = drawnStore('m4-8a')
    const allIds = store.getState().hand.map(coinId)
    store.getState().pickCoin(0)
    store.getState().pickCoin(2)
    store.getState().pickCoin(5)
    store.getState().confirmPlay()

    store.getState().score()
    const after = store.getState()

    expect(after.deck.discardPile.map((c) => c.id).sort((a, b) => a - b)).toEqual(
      [...allIds].sort((a, b) => a - b),
    )
    expect(after.deck.drawPile).toHaveLength(BASE_DECK_SIZE - HAND_SIZE)
  })

  it('handsLeft −1, back to draw, hand and play emptied', () => {
    const store = drawnStore('m4-8b')
    store.getState().pickCoin(0)
    store.getState().confirmPlay()

    store.getState().score()
    const after = store.getState()

    expect(after.handsLeft).toBe(HANDS_PER_BLIND - 1)
    expect(after.handPhase).toBe('draw')
    expect(after.hand.every((s) => s.kind === 'empty')).toBe(true)
    expect(after.play.every((s) => s.kind === 'empty')).toBe(true)
  })

  it('applies the C3 result: blindScore += total, cash += cash, lastScore = result (stub: none/0)', () => {
    const store = drawnStore('m4-8c')
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    const cashBefore = store.getState().cash

    store.getState().score()
    const after = store.getState()

    expect(after.blindScore).toBe(0) // the stub scores nothing
    expect(after.cash).toBe(cashBefore) // the stub pays no coin cash
    expect(after.lastScore).toEqual({ some: true, value: { kind: 'none', cash: 0 } })
  })

  it('score on the last hand ends the blind (target missed → runEnd)', () => {
    const store = drawnStore('m4-8d')
    store.setState({ handsLeft: 1 })
    store.getState().pickCoin(0)
    store.getState().confirmPlay()

    store.getState().score()
    const after = store.getState()

    expect(after.handsLeft).toBe(0)
    expect(after.phase).toBe('runEnd')
    expect(after.won).toBe(false)
  })

  it('score out of the buff phase is a no-op', () => {
    const store = drawnStore('m4-8e') // play phase
    const before = store.getState()

    store.getState().score()
    expect(store.getState()).toEqual(before)
  })
})

describe('M4.9 — out-of-phase actions are no-ops', () => {
  /** A store resting in the given phase (toss/score are transient and cannot be rested in). */
  function atPhase(seed: string, phase: HandPhase) {
    const store = createRunStore()
    store.getState().startRun(seed)
    if (phase === 'play') store.getState().drawHand()
    if (phase === 'buff') {
      store.getState().drawHand()
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
    }
    return store
  }

  const ACTIONS: Record<string, (s: RunStore) => void> = {
    drawHand: (s) => s.drawHand(),
    pickCoin: (s) => s.pickCoin(0),
    unpickCoin: (s) => s.unpickCoin(0),
    discard: (s) => s.discard(0),
    confirmPlay: (s) => s.confirmPlay(),
    echoReflip: (s) => s.echoReflip(0),
    score: (s) => s.score(),
  }

  const VALID_IN: Record<string, HandPhase> = {
    drawHand: 'draw',
    pickCoin: 'play',
    unpickCoin: 'play',
    discard: 'play',
    confirmPlay: 'play',
    echoReflip: 'buff',
    score: 'buff',
  }

  const RESTING: HandPhase[] = ['draw', 'play', 'buff']

  it.each(
    Object.entries(VALID_IN).flatMap(([action, valid]) =>
      RESTING.filter((p) => p !== valid).map((phase) => [action, phase] as const),
    ),
  )('%s is a no-op when fired in the %s phase', (action, phase) => {
    const store = atPhase(`m4-9-${action}-${phase}`, phase)
    const before = store.getState()

    ACTIONS[action](store.getState())

    expect(store.getState()).toEqual(before)
  })

  it('every action is a no-op in the menu phase (no run in progress)', () => {
    const store = createRunStore()
    const before = store.getState()

    for (const act of Object.values(ACTIONS)) act(store.getState())

    expect(store.getState()).toEqual(before)
  })
})

describe('M4.10 — full cycle repeated', () => {
  it('runs a full blind: 10 cycles of draw → play → buff → score, consuming the whole deck', () => {
    const store = createRunStore()
    store.getState().startRun('m4-10')

    for (let cycle = 1; cycle <= HANDS_PER_BLIND; cycle++) {
      store.getState().drawHand()
      expect(store.getState().handPhase).toBe('play')
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
      expect(store.getState().handPhase).toBe('buff')
      store.getState().score()
      const st = store.getState()

      // Coin conservation: every coin is in exactly one place.
      const inHand = st.hand.filter((s) => s.kind === 'filled').length
      const inPlay = st.play.filter((s) => s.kind === 'filled').length
      expect(st.deck.drawPile.length + st.deck.discardPile.length + inHand + inPlay).toBe(
        BASE_DECK_SIZE,
      )
      // 8 coins leave the draw pile and land in the discard pile each cycle.
      expect(st.deck.drawPile).toHaveLength(BASE_DECK_SIZE - HAND_SIZE * cycle)
      expect(st.deck.discardPile).toHaveLength(HAND_SIZE * cycle)

      if (cycle < HANDS_PER_BLIND) {
        expect(st.handPhase).toBe('draw') // the machine loops back
      }
    }

    // The blind ends after the 10th hand.
    const final = store.getState()
    expect(final.handsLeft).toBe(0)
    expect(final.deck.drawPile).toHaveLength(0)
    expect(final.deck.discardPile).toHaveLength(BASE_DECK_SIZE)
    expect(final.phase).toBe('runEnd') // the stub scores 0 → target missed
    expect(final.won).toBe(false)
  })

  it('same seed + same choices → identical blind (reproducibility)', () => {
    const runBlind = (seed: string) => {
      const store = createRunStore()
      store.getState().startRun(seed)
      for (let i = 0; i < HANDS_PER_BLIND; i++) {
        store.getState().drawHand()
        store.getState().pickCoin(0)
        store.getState().pickCoin(3)
        store.getState().confirmPlay()
        store.getState().score()
      }
      const s = store.getState()
      return {
        discardPile: s.deck.discardPile.map((c) => c.id),
        blindScore: s.blindScore,
        cash: s.cash,
        rngState: s.rngState,
        phase: s.phase,
      }
    }
    expect(runBlind('m4-10b')).toEqual(runBlind('m4-10b'))
  })
})

describe('M4.11 — post-score state', () => {
  it('after score: hand and play are empty, and their coins are in discardPile', () => {
    const store = drawnStore('m4-11')
    const handIds = store.getState().hand.map(coinId) // the 8 drawn coins
    store.getState().pickCoin(1)
    store.getState().pickCoin(4)
    store.getState().confirmPlay()

    store.getState().score()
    const after = store.getState()

    // Hand and play are completely empty.
    expect(after.hand.every((s) => s.kind === 'empty')).toBe(true)
    expect(after.play.every((s) => s.kind === 'empty')).toBe(true)
    // The 8 coins that were in the hand are in the discard pile
    // (2 tossed + 6 unpicked).
    expect(after.deck.discardPile.map((c) => c.id).sort((a, b) => a - b)).toEqual(
      [...handIds].sort((a, b) => a - b),
    )
    // Nothing else moved: the draw pile is untouched.
    expect(after.deck.drawPile).toHaveLength(BASE_DECK_SIZE - HAND_SIZE)
  })
})
