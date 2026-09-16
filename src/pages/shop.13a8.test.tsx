// @vitest-environment jsdom
//
// 13a.8 — Rework the shop layout (WBS 13a.8):
//   - the coin collection is the visual anchor (first, above the offers)
//   - the offers are grouped by kind (Charms / Coins / Hand size sections)
//   - Reroll is labeled "free, once" (and "Rerolled" after use)
//   - Leave nudges when cash is unspent (it carries over to the next blind)
//   - an unaffordable offer shows its poor state (the card dims)
//
// The merge/remove store logic is covered in shop.test.ts / charms.test.ts;
// the drag-to-merge interaction is covered in collection.13a8.test.tsx.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import type { ShopOffer } from '@/core/types'
import { ShopScreen } from './shop'

/** A valid set of five shop offers (two of each charm/coin kind + hand size). */
const OFFERS: ShopOffer[] = [
  { kind: 'charm', charm: 'plusChips' },
  { kind: 'coin', effect: 'weight' },
  { kind: 'coin', effect: 'echo' },
  { kind: 'charm', charm: 'payday' },
  { kind: 'handSize' },
]

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(() => {
  cleanup()
})

/** A store in the shop phase with the fixed offers. */
function shopState(): void {
  useRunStore.getState().startRun('13a8')
  useRunStore.setState({ phase: 'shop', shop: { offers: OFFERS, rerollUsed: false } })
}

describe('13a.8 — shop layout', () => {
  it('the collection is the visual anchor (first, above the offers)', () => {
    shopState()
    render(<ShopScreen />)
    const collection = document.querySelector('.collection')
    const firstSection = document.querySelector('.offer-section')
    expect(collection).toBeTruthy()
    expect(firstSection).toBeTruthy()
    // DOM order: the deck panel comes before any offer section.
    expect(collection!.compareDocumentPosition(firstSection!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // …and it is the deck the player is building (24 base coins).
    expect(screen.getByText('Your deck')).toBeTruthy()
    expect(screen.getByText('24 coins')).toBeTruthy()
  })

  it('the offers are grouped by kind (Charms / Coins / Hand size)', () => {
    shopState()
    render(<ShopScreen />)
    const charms = screen.getByRole('region', { name: 'Charms' })
    const coins = screen.getByRole('region', { name: 'Coins' })
    const handSize = screen.getByRole('region', { name: 'Hand size' })
    expect(charms.querySelectorAll('.offer-card')).toHaveLength(2)
    expect(coins.querySelectorAll('.offer-card')).toHaveLength(2)
    expect(handSize.querySelectorAll('.offer-card')).toHaveLength(1)
    // The section order is charm → coin → hand size.
    expect(
      charms.compareDocumentPosition(coins) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      coins.compareDocumentPosition(handSize) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('Reroll is labeled "free, once" and reads "Rerolled" after use', () => {
    shopState()
    render(<ShopScreen />)
    const reroll = screen.getByRole('button', { name: /reroll \(free, once\)/i })
    fireEvent.click(reroll)
    expect(useRunStore.getState().shop.rerollUsed).toBe(true)
    const rerolled = screen.getByRole('button', { name: /rerolled/i })
    expect(rerolled.hasAttribute('disabled')).toBe(true)
  })

  it('Leave nudges when cash is unspent (and is quiet at $0)', () => {
    shopState()
    useRunStore.setState({ cash: 7 })
    render(<ShopScreen />)
    expect(screen.getByText(/leaving with \$7/i)).toBeTruthy()

    cleanup()
    shopState()
    useRunStore.setState({ cash: 0 })
    render(<ShopScreen />)
    expect(screen.queryByText(/leaving with/i)).toBeNull()
  })

  it('an unaffordable offer shows the poor state (the card dims)', () => {
    shopState()
    useRunStore.setState({ cash: 0 })
    render(<ShopScreen />)
    // Every offer costs money → all five cards are in the poor state.
    expect(document.querySelectorAll('.offer-card--poor')).toHaveLength(5)
    expect(document.querySelectorAll('.offer-card:not(.offer-card--poor)')).toHaveLength(0)

    cleanup()
    shopState()
    useRunStore.setState({ cash: 100 })
    render(<ShopScreen />)
    expect(document.querySelectorAll('.offer-card--poor')).toHaveLength(0)
  })
})
