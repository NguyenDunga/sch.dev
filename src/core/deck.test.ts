import { describe, expect, it } from 'vitest'
import {
  buildCollection,
  discardToPile,
  drawFromDeck,
  returnHandToPile,
  shuffleCollection,
} from './deck'
import { createRng } from './rng'
import { BASE_DECK_SIZE } from './balance'
import { filledSlot, none, some } from './helpers'
import type { Hand } from './types'

describe('buildCollection', () => {
  it('builds the base collection of plain 50/50 coins with unique ids', () => {
    const deck = buildCollection(BASE_DECK_SIZE)
    expect(deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    expect(deck.discardPile).toHaveLength(0)
    for (const coin of deck.drawPile) {
      expect(coin.effects).toEqual([])
    }
    expect(new Set(deck.drawPile.map((c) => c.id)).size).toBe(BASE_DECK_SIZE)
  })
})

describe('shuffleCollection', () => {
  it('merges both piles into the draw pile and clears the discard pile', () => {
    const deck = buildCollection(4)
    const [a, b] = deck.drawPile
    const withDiscards = {
      drawPile: deck.drawPile.slice(2),
      discardPile: [a, b],
    }
    const shuffled = shuffleCollection(createRng('abc'), withDiscards)
    expect(shuffled.drawPile).toHaveLength(4)
    expect(shuffled.discardPile).toHaveLength(0)
    expect(new Set(shuffled.drawPile.map((c) => c.id))).toEqual(new Set([a.id, b.id, 2, 3]))
  })

  it('same seed → same shuffle (reproducible)', () => {
    const a = createRng('abc')
    const b = createRng('abc')
    const deckA = shuffleCollection(a, buildCollection(BASE_DECK_SIZE))
    const deckB = shuffleCollection(b, buildCollection(BASE_DECK_SIZE))
    expect(deckA.drawPile.map((c) => c.id)).toEqual(deckB.drawPile.map((c) => c.id))
  })

  it('different seed → different shuffle', () => {
    const a = createRng('abc')
    const b = createRng('abd')
    const deckA = shuffleCollection(a, buildCollection(BASE_DECK_SIZE))
    const deckB = shuffleCollection(b, buildCollection(BASE_DECK_SIZE))
    expect(deckA.drawPile.map((c) => c.id)).not.toEqual(deckB.drawPile.map((c) => c.id))
  })
})

describe('drawFromDeck', () => {
  it('peeks coins from the draw pile in order (no rng)', () => {
    const deck = buildCollection(3)
    expect(drawFromDeck(deck)).toEqual(some(deck.drawPile[0]))
    expect(drawFromDeck({ ...deck, drawPile: deck.drawPile.slice(1) })).toEqual(
      some(deck.drawPile[1]),
    )
  })

  it('returns none when the pile is empty (the hand shrinks)', () => {
    expect(drawFromDeck({ drawPile: [], discardPile: [] })).toEqual(none)
  })
})

describe('discardToPile', () => {
  it('moves the coin to the discard pile without mutating the deck', () => {
    const deck = buildCollection(2)
    const coin = deck.drawPile[0]
    const next = discardToPile(deck, coin)
    expect(next.discardPile).toEqual([coin])
    expect(next.drawPile).toEqual(deck.drawPile)
    expect(deck.discardPile).toHaveLength(0)
  })
})

describe('returnHandToPile', () => {
  it('moves all hand coins to the discard pile; empty slots count as nothing', () => {
    const deck = buildCollection(5)
    const hand: Hand = [
      filledSlot(deck.drawPile[0], 'H'),
      { kind: 'empty' },
      filledSlot(deck.drawPile[1], 'T'),
      { kind: 'empty' },
      { kind: 'empty' },
    ]
    const next = returnHandToPile(deck, hand)
    expect(next.discardPile).toEqual([deck.drawPile[0], deck.drawPile[1]])
    expect(next.drawPile).toEqual(deck.drawPile)
    expect(deck.discardPile).toHaveLength(0)
  })

  it('keeps existing discards (hand coins are appended)', () => {
    const deck = buildCollection(5)
    const discarded = discardToPile(deck, deck.drawPile[0])
    const hand: Hand = [
      filledSlot(deck.drawPile[1], 'H'),
      { kind: 'empty' },
      { kind: 'empty' },
      { kind: 'empty' },
      { kind: 'empty' },
    ]
    const next = returnHandToPile(discarded, hand)
    expect(next.discardPile).toEqual([deck.drawPile[0], deck.drawPile[1]])
  })
})
