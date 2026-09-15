// 13.1 — deal detection (pure): which hand coins just arrived from the deck,
// and their stagger index. No DOM — plain unit test.

import { describe, expect, it } from 'vitest'
import { emptyHand, filledSlot } from '@/core/helpers'
import type { Hand, HandSlot } from '@/core/types'
import { computeDealIndex, type PrevSlots } from './deal'

const noPrev: PrevSlots = { hand: new Set(), play: new Set() }

function handOf(ids: number[]): Hand {
  return ids.map((id): HandSlot => filledSlot({ id, effects: [] }, 'H'))
}

describe('13.1 — computeDealIndex (deal detection)', () => {
  it('a fresh hand (empty prev) deals every coin, staggered in slot order', () => {
    expect(computeDealIndex(handOf([10, 11, 12]), noPrev)).toEqual(new Map([[10, 0], [11, 1], [12, 2]]))
  })

  it('coins already seated in the hand get no index', () => {
    const prev: PrevSlots = { hand: new Set([10]), play: new Set() }
    expect(computeDealIndex(handOf([10, 11]), prev)).toEqual(new Map([[11, 0]]))
  })

  it('an unpick return (prev play) gets no index — the crossfade plays instead', () => {
    const prev: PrevSlots = { hand: new Set([10]), play: new Set([11]) }
    expect(computeDealIndex(handOf([10, 11]), prev)).toEqual(new Map())
  })

  it('a draw-enchant redraw deals only the new coins', () => {
    const prev: PrevSlots = { hand: new Set([10, 11]), play: new Set() }
    expect(computeDealIndex(handOf([10, 11, 12]), prev)).toEqual(new Map([[12, 0]]))
  })

  it('empty slots are skipped (stagger indexes stay 0-based over dealt coins)', () => {
    const hand: Hand = [
      filledSlot({ id: 10, effects: [] }, 'H'),
      { kind: 'empty' },
      filledSlot({ id: 11, effects: [] }, 'H'),
    ]
    expect(computeDealIndex(hand, noPrev)).toEqual(new Map([[10, 0], [11, 1]]))
  })

  it('an empty hand deals nothing', () => {
    expect(computeDealIndex(emptyHand(8), noPrev)).toEqual(new Map())
  })
})
