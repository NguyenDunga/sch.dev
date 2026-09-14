import { describe, expect, it } from 'vitest'
import { buildCollection, discardToPile, drawFromDeck, returnHandToPile, shuffleCollection } from './deck'
import { BASE_DECK_SIZE } from './balance'
import { createRng, type Rng } from './rng'
import { filledSlot, isSome, none, some } from './helpers'
import type { Coin, Deck, Hand } from './types'

/** Small test deck of n plain coins (ids 0..n-1) — a test fixture, not a balance value. */
const smallDeck = (n: number): Deck => ({
  drawPile: Array.from({ length: n }, (_, i) => ({ id: i, effects: [] })),
  discardPile: [],
})

const ids = (deck: Deck): number[] => deck.drawPile.map((c) => c.id)
const sortedIds = (deck: Deck): number[] => [...ids(deck)].sort((a, b) => a - b)

describe('buildCollection', () => {
  it('builds the base collection of plain 50/50 coins (effects: [])', () => {
    const deck = buildCollection()
    expect(deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    expect(deck.discardPile).toHaveLength(0)
    for (const coin of deck.drawPile) {
      expect(coin.effects).toEqual([])
    }
  })

  it('assigns distinct ids to every coin', () => {
    const deck = buildCollection()
    expect(new Set(deck.drawPile.map((c) => c.id)).size).toBe(BASE_DECK_SIZE)
  })
})

describe('shuffleCollection', () => {
  it('merges drawPile + discardPile into the draw pile and clears the discard pile', () => {
    const deck = smallDeck(4)
    const split: Deck = { drawPile: deck.drawPile.slice(2), discardPile: deck.drawPile.slice(0, 2) }
    const shuffled = shuffleCollection(createRng('abc'), split)
    expect(shuffled.discardPile).toHaveLength(0)
    expect(shuffled.drawPile).toHaveLength(4)
    expect(sortedIds(shuffled)).toEqual([0, 1, 2, 3])
  })

  it('preserves the same multiset of ids (no coin lost or duplicated)', () => {
    const deck = buildCollection()
    const shuffled = shuffleCollection(createRng('abc'), deck)
    expect(sortedIds(shuffled)).toEqual(sortedIds(deck))
  })

  it('is seed-deterministic (same seed → same order)', () => {
    const a = shuffleCollection(createRng('abc'), buildCollection())
    const b = shuffleCollection(createRng('abc'), buildCollection())
    expect(ids(a)).toEqual(ids(b))
  })

  it('different seeds → different order', () => {
    const a = shuffleCollection(createRng('abc'), buildCollection())
    const b = shuffleCollection(createRng('abd'), buildCollection())
    expect(ids(a)).not.toEqual(ids(b))
  })

  it('consumes one rng draw per swap (n − 1 draws for n coins)', () => {
    const rng = createRng('abc')
    let draws = 0
    const counting: Rng = {
      next: () => {
        draws += 1
        return rng.next()
      },
      state: rng.state,
      restore: rng.restore,
    }
    shuffleCollection(counting, smallDeck(5))
    expect(draws).toBe(4)
  })

  it('does not mutate the input deck', () => {
    const deck = smallDeck(4)
    const split: Deck = { drawPile: deck.drawPile.slice(2), discardPile: deck.drawPile.slice(0, 2) }
    const before = JSON.parse(JSON.stringify(split))
    shuffleCollection(createRng('abc'), split)
    expect(split).toEqual(before)
  })

  it('blind start: clears the discard pile and the draw pile holds the full collection', () => {
    const deck = smallDeck(6)
    const split: Deck = { drawPile: deck.drawPile.slice(4), discardPile: deck.drawPile.slice(0, 4) }
    const shuffled = shuffleCollection(createRng('abc'), split)
    expect(shuffled.discardPile).toHaveLength(0)
    expect(shuffled.drawPile).toHaveLength(6)
  })
})

describe('finite pile within a blind (no mid-blind reshuffle)', () => {
  it('draining the draw pile leaves it empty; discards grow; nothing returns to the draw pile', () => {
    let deck = smallDeck(5)
    // Draw every coin (peek + pop, as the store does)
    const drawn: Coin[] = []
    for (;;) {
      const o = drawFromDeck(deck)
      if (!isSome(o)) break
      drawn.push(o.value)
      deck = { ...deck, drawPile: deck.drawPile.slice(1) }
    }
    expect(drawn).toHaveLength(5)
    // After scoring: hand coins → discard; the rest discarded individually
    const hand: Hand = drawn.slice(0, 3).map((c) => filledSlot(c, 'H'))
    deck = returnHandToPile(deck, hand)
    for (const c of drawn.slice(3)) deck = discardToPile(deck, c)
    expect(deck.drawPile).toHaveLength(0)
    expect(deck.discardPile).toHaveLength(5)
    // Drawing again still yields none — the hand shrinks, no mid-blind reshuffle
    expect(drawFromDeck(deck)).toEqual(none)
  })
})

describe('drawFromDeck', () => {
  it('peeks the next coin in draw order without consuming it (no rng)', () => {
    const deck = smallDeck(3)
    expect(drawFromDeck(deck)).toEqual(some(deck.drawPile[0]))
    // Peek again — same coin: the caller pops (`drawPile.slice(1)`) after taking it
    expect(drawFromDeck(deck)).toEqual(some(deck.drawPile[0]))
    const popped: Deck = { ...deck, drawPile: deck.drawPile.slice(1) }
    expect(drawFromDeck(popped)).toEqual(some(deck.drawPile[1]))
  })

  it('does not mutate the deck', () => {
    const deck = smallDeck(3)
    const before = JSON.parse(JSON.stringify(deck))
    drawFromDeck(deck)
    expect(deck).toEqual(before)
  })

  it('returns none when the draw pile is empty (no throw)', () => {
    expect(drawFromDeck({ drawPile: [], discardPile: [] })).toEqual(none)
  })
})

describe('discardToPile', () => {
  it('appends the coin to the discard pile; draw pile untouched', () => {
    const deck = smallDeck(3)
    const coin = deck.drawPile[0]
    const next = discardToPile(deck, coin)
    expect(next.discardPile).toEqual([coin])
    expect(next.drawPile).toEqual(deck.drawPile)
  })

  it('does not mutate the input deck', () => {
    const deck = smallDeck(3)
    const before = JSON.parse(JSON.stringify(deck))
    discardToPile(deck, deck.drawPile[0])
    expect(deck).toEqual(before)
  })
})

describe('returnHandToPile', () => {
  it('moves all hand coins to the discard pile in hand order; empty slots count as nothing', () => {
    const deck = smallDeck(5)
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
  })

  it('appends to existing discards', () => {
    const deck = smallDeck(5)
    const withDiscard = discardToPile(deck, deck.drawPile[0])
    const hand: Hand = [filledSlot(deck.drawPile[1], 'H'), { kind: 'empty' }, { kind: 'empty' }]
    const next = returnHandToPile(withDiscard, hand)
    expect(next.discardPile).toEqual([deck.drawPile[0], deck.drawPile[1]])
  })

  it('does not mutate the deck or the hand', () => {
    const deck = smallDeck(5)
    const hand: Hand = [filledSlot(deck.drawPile[0], 'H'), { kind: 'empty' }, { kind: 'empty' }]
    const beforeDeck = JSON.parse(JSON.stringify(deck))
    const beforeHand = JSON.parse(JSON.stringify(hand))
    returnHandToPile(deck, hand)
    expect(deck).toEqual(beforeDeck)
    expect(hand).toEqual(beforeHand)
  })
})
