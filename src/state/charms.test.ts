// M7.6 + M8 — mergeCoin and charm reordering (shopActions via runStore).
//
// M7.6: merging is free, target gains all source effects, source is deleted.
// M8: moveCharm reorders the charm bar — array order is the scoring order.

import { describe, expect, it } from 'vitest'
import { HAND_SIZE, PLAY_SIZE } from '@/core/balance'
import { emptyHand, filledSlot } from '@/core/helpers'
import type { Face } from '@/core/types'
import { createRunStore, type RunStore } from './runStore'

describe('M7.6 — mergeCoin (shop action)', () => {
  /** A store in the shop phase with two injected effect coins in the collection. */
  function shopStore() {
    const store = createRunStore()
    store.getState().startRun('m7-6')
    store.setState({ phase: 'shop' })
    store.setState((s) => ({
      deck: {
        drawPile: [
          { id: 900, effects: [{ kind: 'weight', favored: 'H' as Face }] },
          { id: 901, effects: [] },
          ...s.deck.drawPile,
        ],
        discardPile: s.deck.discardPile,
      },
    }))
    return store
  }

  it('target gains all of the source effects; source removed from the collection; free', () => {
    const store = shopStore()
    const cashBefore = store.getState().cash
    store.getState().mergeCoin(900, 901)
    const st = store.getState()

    const target = [...st.deck.drawPile, ...st.deck.discardPile].find((c) => c.id === 901)
    expect(target?.effects).toEqual([{ kind: 'weight', favored: 'H' }])
    expect([...st.deck.drawPile, ...st.deck.discardPile].some((c) => c.id === 900)).toBe(false)
    expect(st.cash).toBe(cashBefore) // free
  })

  it('effects stack (no cap): a coin with a face effect gains a second face effect', () => {
    const store = shopStore()
    store.setState((s) => ({
      deck: {
        drawPile: s.deck.drawPile.map((c) =>
          c.id === 901 ? { id: 901, effects: [{ kind: 'tails' }] } : c,
        ),
        discardPile: s.deck.discardPile,
      },
    }))
    store.getState().mergeCoin(900, 901)
    const target = store.getState().deck.drawPile.find((c) => c.id === 901)
    expect(target?.effects).toEqual([
      { kind: 'tails' },
      { kind: 'weight', favored: 'H' },
    ])
  })

  it('works when the source sits in the discard pile', () => {
    const store = shopStore()
    store.setState((s) => ({
      deck: {
        drawPile: s.deck.drawPile.filter((c) => c.id !== 900),
        discardPile: [{ id: 900, effects: [{ kind: 'tax' }] }, ...s.deck.discardPile],
      },
    }))
    store.getState().mergeCoin(900, 901)
    const st = store.getState()
    expect(st.deck.discardPile.some((c) => c.id === 900)).toBe(false)
    expect(st.deck.drawPile.find((c) => c.id === 901)?.effects).toEqual([{ kind: 'tax' }])
  })

  it('no-ops: wrong phase, unknown id, self-merge', () => {
    const store = shopStore()
    const before = store.getState()

    store.setState({ phase: 'run' })
    store.getState().mergeCoin(900, 901)
    expect(store.getState().deck).toEqual(before.deck) // wrong phase

    store.setState({ phase: 'shop' })
    store.getState().mergeCoin(4242, 901)
    store.getState().mergeCoin(900, 4242)
    store.getState().mergeCoin(900, 900)
    expect(store.getState().deck).toEqual(before.deck) // unknown ids + self-merge
  })
})

describe('M8 — charms: moveCharm + scoring order', () => {
  /** A store resting in the buff phase with a fully-resolved play (deterministic faces). */
  function buffStore(charms: RunStore['charms'], faces: Face[]) {
    const store = createRunStore()
    store.getState().startRun('m8')
    let id = 100
    store.setState({
      phase: 'run',
      handPhase: 'buff',
      charms,
      handsLeft: 5,
      hand: emptyHand(HAND_SIZE),
      play: [
        ...faces.map((face) => filledSlot({ id: id++, effects: [] }, face)),
        ...Array.from({ length: PLAY_SIZE - faces.length }, () => ({ kind: 'empty' as const })),
      ],
    })
    return store
  }

  it('8.3 moveCharm reorders charms (array order is the only ordering source)', () => {
    const store = createRunStore()
    store.getState().startRun('m8-3')
    store.setState({
      phase: 'shop',
      charms: ['plusChips', 'plusMult', 'extraHand'],
    })

    store.getState().moveCharm(0, 2)
    expect(store.getState().charms).toEqual(['plusMult', 'extraHand', 'plusChips'])
    store.getState().moveCharm(2, 0)
    expect(store.getState().charms).toEqual(['plusChips', 'plusMult', 'extraHand'])
  })

  it('8.3 moveCharm no-ops: from === to, out of range, menu phase', () => {
    const store = createRunStore()
    store.getState().startRun('m8-3b')
    store.setState({ charms: ['plusChips', 'plusMult'] }) // phase 'run'
    const before = store.getState().charms

    store.getState().moveCharm(0, 0)
    store.getState().moveCharm(0, 5)
    store.getState().moveCharm(2, 0)
    store.getState().moveCharm(-1, 0)
    expect(store.getState().charms).toEqual(before)

    store.setState({ phase: 'menu' })
    store.getState().moveCharm(0, 1)
    expect(store.getState().charms).toEqual(before)
  })

  it('8.6 reordering changes scoring only for plusChips + jackpotFever on a Jackpot hand', () => {
    // Jackpot HHHHH, [plusChips, jackpotFever] → (50+10)×2 chips × 4 = 480
    const a = buffStore(['plusChips', 'jackpotFever'], ['H', 'H', 'H', 'H', 'H'])
    a.getState().score()
    expect(a.getState().blindScore).toBe(480)

    // Reorder → [jackpotFever, plusChips] → (50×2+10) chips × 4 = 440
    const b = buffStore(['plusChips', 'jackpotFever'], ['H', 'H', 'H', 'H', 'H'])
    b.getState().moveCharm(0, 1)
    expect(b.getState().charms).toEqual(['jackpotFever', 'plusChips'])
    b.getState().score()
    expect(b.getState().blindScore).toBe(440)
  })

  it('8.6 reordering a commutative pair (plusChips + plusMult) does not change the score', () => {
    const scoreWith = (charms: RunStore['charms']) => {
      const store = buffStore(charms, ['H', 'H', 'T', 'H']) // threeSame 15×1
      store.getState().score()
      return store.getState().blindScore
    }
    expect(scoreWith(['plusChips', 'plusMult'])).toBe(50) // (15+10) × (1+1)
    expect(scoreWith(['plusMult', 'plusChips'])).toBe(50)
  })
})

