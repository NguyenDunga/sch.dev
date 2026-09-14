// M4 — Hand Phase State Machine (src/state/runStore.ts).
//
// M4.1: handPhase only ever moves along draw → play → toss → buff → score → draw.
// The test records every handPhase transition the store emits and asserts each
// observed transition is the next step of the cycle.

import { describe, expect, it } from 'vitest'
import { BASE_DECK_SIZE, HANDS_PER_BLIND, HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import type { HandPhase } from '@/core/types'
import { createRunStore } from './runStore'

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
