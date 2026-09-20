// @vitest-environment jsdom
// Wiki — the "?" button opens the tabbed reference dialog; the tab set is the
// WIKI_TABS registry (add a tab → it renders); Esc / the × / the overlay
// close it.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { WikiButton } from './wiki-button'
import { WIKI_TABS } from './wiki-tabs'
import { TIERS, zeroTierUpgrades } from '@/core/balance'
import { COIN_CATALOG } from '@/config/coins'
import { CHARM_CATALOG } from '@/config/charms'
import { useRunStore } from '@/state/runStore'

afterEach(() => cleanup())

describe('WikiButton', () => {
  it('opens the dialog on click', () => {
    render(<WikiButton />)
    expect(screen.queryByRole('dialog', { name: '50/50 reference' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    expect(screen.getByRole('dialog', { name: '50/50 reference' })).toBeTruthy()
  })

  it('renders every registry tab (in order)', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(WIKI_TABS.map((t) => t.label))
  })

  it('the Patterns tab lists every tier from the balance table', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    for (const tier of TIERS) {
      expect(screen.getByText(tier.name)).toBeTruthy()
    }
    expect(screen.getByText(/Highest tier wins/)).toBeTruthy()
  })

  it('M22: the Patterns tab shows effective values with purchased upgrades ("50 → 60 (+10)")', () => {
    useRunStore.setState({
      tierUpgrades: {
        ...zeroTierUpgrades(),
        jackpot: { chips: 10, mult: 0 },
        alternating: { chips: 0, mult: 1 },
      },
    })
    try {
      render(<WikiButton />)
      fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
      // Upgraded tiers: base → effective (+amount).
      expect(screen.getByText('50 → 60 (+10)')).toBeTruthy() // jackpot chips
      expect(screen.getByText('4 → 5 (+1)')).toBeTruthy() // alternating mult
      // Unupgraded tiers fall back to the plain base value.
      expect(screen.getByText('40')).toBeTruthy() // fourRow chips
      expect(screen.getByText('15')).toBeTruthy() // threeSame chips
    } finally {
      useRunStore.setState({ tierUpgrades: zeroTierUpgrades() })
    }
  })

  it('the Coins tab lists every catalog coin with its price', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    fireEvent.click(screen.getByRole('tab', { name: /Coins/ }))
    for (const def of COIN_CATALOG) {
      expect(screen.getByText(def.name)).toBeTruthy()
      // Prices repeat (several $5 offers) — count, don't single out.
      expect(screen.getAllByText(`$${def.price}`).length).toBeGreaterThan(0)
    }
  })

  it('the Charms tab lists every charm', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    fireEvent.click(screen.getByRole('tab', { name: /Charms/ }))
    for (const charm of CHARM_CATALOG) {
      expect(screen.getByText(charm.name)).toBeTruthy()
    }
  })

  it('Esc closes the dialog', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '50/50 reference' })).toBeNull()
  })

  it('the × closes the dialog', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close reference' }))
    expect(screen.queryByRole('dialog', { name: '50/50 reference' })).toBeNull()
  })

  it('the overlay click closes the dialog', () => {
    render(<WikiButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Help — 50/50 reference' }))
    fireEvent.click(document.querySelector('.wiki-overlay')!)
    expect(screen.queryByRole('dialog', { name: '50/50 reference' })).toBeNull()
  })
})
