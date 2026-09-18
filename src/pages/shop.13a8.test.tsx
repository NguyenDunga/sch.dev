// @vitest-environment jsdom
//
// 13a.14 — Shop areas (draft): Trade / Forge / Recycler tabs.
//   - the three areas are tabs, one visible at a time (Trade is the default)
//   - the deck lives behind a small header icon (shop-only, read-only)
//   - the Trade area keeps the 13a.8 offer grouping (Charms / Coins / Hand size)
//   - Reroll is labeled "free, once" (and "Rerolled" after use)
//   - Leave nudges when cash is unspent (it carries over to the next blind)
//   - an unaffordable offer shows its poor state (the card dims)
//
// The Forge store logic is covered in core/forge.test.ts + state/charms.test.ts.

import { act } from 'react'
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
  useRunStore.getState().startRun('13a14')
  useRunStore.setState({ phase: 'shop', shop: { offers: OFFERS, rerollUsed: false } })
}

describe('13a.14 — shop areas (draft)', () => {
  it('the three areas are tabs; Trade is the default', () => {
    shopState()
    render(<ShopScreen />)
    const tabs = screen.getByRole('navigation', { name: 'Shop areas' })
    expect(tabs.querySelectorAll('.shop-tab')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Trade' }).getAttribute('aria-current')).toBe('page')
    // Trade is visible by default; Forge/Recycler are not.
    expect(screen.queryByRole('region', { name: 'Forge' })).toBeNull()
    expect(screen.queryByRole('region', { name: 'Recycler' })).toBeNull()
    expect(screen.getByRole('region', { name: 'Charms' })).toBeTruthy()
  })

  it('switching tabs shows the Forge / Recycler areas', () => {
    shopState()
    render(<ShopScreen />)

    fireEvent.click(screen.getByRole('button', { name: 'Forge' }))
    expect(screen.getByRole('region', { name: 'Forge' })).toBeTruthy()
    expect(screen.queryByRole('region', { name: 'Charms' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Recycler' }))
    const recycler = screen.getByRole('region', { name: 'Recycler' })
    expect(recycler).toBeTruthy()
    // The 24 base coins are listed, each with a sell price ($1 minimum).
    expect(recycler.querySelectorAll('.recycler-row')).toHaveLength(24)
    expect(recycler.querySelectorAll('.recycler-price')).toHaveLength(24)
  })

  it('the deck lives behind the header icon (shop-only, read-only)', () => {
    shopState()
    render(<ShopScreen />)
    // The deck is hidden until the icon is clicked.
    expect(screen.queryByText('Your deck')).toBeNull()

    const icon = screen.getByRole('button', { name: 'Show deck' })
    fireEvent.click(icon)
    expect(icon.getAttribute('aria-expanded')).toBe('true')
    const panel = screen.getByRole('dialog', { name: 'Your deck' })
    expect(panel).toBeTruthy()
    expect(screen.getByText('24 coins')).toBeTruthy()
    expect(panel.querySelectorAll('.deck-item')).toHaveLength(24)
    // Read-only: the only button in the panel is the Close button.
    expect(panel.querySelectorAll('button')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Your deck' })).toBeNull()
  })

  it('the recycler list is sortable (price high→low by default)', () => {
    shopState()
    useRunStore.setState({
      deck: {
        drawPile: [
          { id: 3, effects: [{ kind: 'tax' }, { kind: 'echo' }] }, // $2
          { id: 1, effects: [{ kind: 'tax' }] }, // $1
          { id: 2, effects: [] }, // plain — $1 minimum
        ],
        discardPile: [],
      },
    })
    render(<ShopScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Recycler' }))
    const rows = () =>
      Array.from(document.querySelectorAll('.recycler-row .recycler-effects')).map((el) => el.textContent)

    // Default: price high → low (the 2-effect coin first).
    expect(rows()).toEqual(['2 effects', '1 effect', 'plain 50/50'])

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort' }), { target: { value: 'priceAsc' } })
    expect(rows()).toEqual(['1 effect', 'plain 50/50', '2 effects'])

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort' }), { target: { value: 'order' } })
    expect(rows()).toEqual(['2 effects', '1 effect', 'plain 50/50']) // deck order
  })

  it('the forge: two weight(H) coins forge into a heads coin (costs $1)', () => {
    shopState()
    useRunStore.setState({
      cash: 10,
      deck: {
        drawPile: [
          { id: 50, effects: [{ kind: 'weight', favored: 'H' }] },
          { id: 51, effects: [{ kind: 'weight', favored: 'H' }] },
        ],
        discardPile: [],
      },
    })
    render(<ShopScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Forge' }))
    const pickButtons = () => Array.from(document.querySelectorAll('.forge-coin'))
    // The rule line is always rendered (space reserved) — hidden until a rule fires.
    const special = () => document.querySelector('.forge-special') as HTMLElement
    expect(special().className).toContain('forge-special--hidden')
    fireEvent.click(pickButtons()[0])
    fireEvent.click(pickButtons()[1])
    // The preview shows the fired rule + the resulting coin.
    expect(special().className).not.toContain('forge-special--hidden')
    expect(special().textContent).toBe('Weight(H) + Weight(H) → Heads')
    fireEvent.click(screen.getByRole('button', { name: 'Forge ($1)' }))
    const st = useRunStore.getState()
    expect(st.cash).toBe(9)
    const collection = [...st.deck.drawPile, ...st.deck.discardPile]
    expect(collection).toHaveLength(1)
    expect(collection[0].effects).toEqual([{ kind: 'heads' }])
    // The slots clear after the forge.
    expect(document.querySelectorAll('.forge-coin--picked')).toHaveLength(0)
  })

  it('the forge button is disabled until two coins are picked and the cash is there', () => {
    shopState()
    useRunStore.setState({
      cash: 0,
      deck: {
        drawPile: [
          { id: 50, effects: [{ kind: 'tax' }] },
          { id: 51, effects: [{ kind: 'tax' }] },
        ],
        discardPile: [],
      },
    })
    render(<ShopScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Forge' }))
    const forgeButton = () => screen.getByRole('button', { name: 'Forge ($1)' })
    expect(forgeButton().hasAttribute('disabled')).toBe(true) // nothing picked

    const pickButtons = () => Array.from(document.querySelectorAll('.forge-coin'))
    fireEvent.click(pickButtons()[0])
    expect(forgeButton().hasAttribute('disabled')).toBe(true) // one coin

    fireEvent.click(pickButtons()[1])
    expect(forgeButton().hasAttribute('disabled')).toBe(true) // two coins, no cash
    expect(screen.getByText('need $1 cash')).toBeTruthy()

    act(() => useRunStore.setState({ cash: 1 }))
    expect(forgeButton().hasAttribute('disabled')).toBe(false)
  })

  it('the recycler: selling a coin removes it and pays its price', () => {
    shopState()
    useRunStore.setState({
      cash: 10,
      deck: {
        drawPile: [
          { id: 60, effects: [{ kind: 'tax' }, { kind: 'echo' }] }, // $2
          { id: 61, effects: [] }, // $1
        ],
        discardPile: [],
      },
    })
    render(<ShopScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Recycler' }))
    const sell = () => screen.getAllByRole('button', { name: 'Sell' })
    expect(sell()).toHaveLength(2)

    // Default sort is price-desc → the first row is the $2 coin.
    fireEvent.click(sell()[0])
    const st = useRunStore.getState()
    expect(st.cash).toBe(12)
    expect([...st.deck.drawPile, ...st.deck.discardPile].map((c) => c.id)).toEqual([61])
    expect(sell()).toHaveLength(1)

    fireEvent.click(sell()[0])
    expect(useRunStore.getState().cash).toBe(13)
    expect(document.querySelector('.recycler-empty')).toBeTruthy()
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
