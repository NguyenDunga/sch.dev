import { describe, expect, it } from 'vitest'
import { buildCollection } from './deck'
import { BASE_DECK_SIZE } from './balance'

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
