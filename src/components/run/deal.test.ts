// 13.1 — deal detection (pure): which hand coins just arrived from the deck,
// and their stagger index. No DOM — plain unit test.

import { describe, expect, it } from 'vitest'
import { emptyHand, filledSlot } from '@/core/helpers'
import type { Hand, HandSlot } from '@/core/types'
import { computeDealIndex, sameIds, type PrevSlots } from './piles/deal'

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

describe('13.1 — sameIds (render-phase convergence)', () => {
  it('a row equal to its prev ids is recognised (no re-deal loop)', () => {
    const hand = handOf([10, 11, 12])
    expect(sameIds(new Set([10, 11, 12]), hand)).toBe(true)
  })

  it('a changed row is not equal', () => {
    expect(sameIds(new Set([10, 11]), handOf([10, 11, 12]))).toBe(false)
  })

  // Regression (player report 2026-07-22): a row holding two coins with the
  // same id must still compare equal to its own prev — the old slot-count
  // comparison (8 slots vs 7 unique ids) never settled, looping the
  // render-phase setDealState ("Too many re-renders" → frozen screen).
  it('a row with a duplicate id compares equal to its own prev (set equality)', () => {
    const hand = handOf([10, 11, 10])
    const prev = new Set(hand.map((s) => (s.kind === 'filled' ? s.coin.id : -1)).filter((i) => i >= 0))
    expect(sameIds(prev, hand)).toBe(true)
  })
})
