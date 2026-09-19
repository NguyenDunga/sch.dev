// @vitest-environment jsdom
//
// Smoke tests (12.11): each screen renders from a valid RunState without
// throwing. Uses jsdom + @testing-library/react. These are smoke tests (render
// without throwing) — they do not drive the full game loop or assert coverage.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import type { ShopOffer } from '@/core/types'
import { MenuScreen } from './menu'
import { RunScreen } from './run'
import { ShopScreen } from './shop'
import { RunEndScreen } from './run-end'

/** A valid set of five shop offers (one of each kind). */
const OFFERS: ShopOffer[] = [
  { kind: 'charm', charm: 'plusChips' },
  { kind: 'coin', effect: 'weight' },
  { kind: 'coin', effect: 'echo' },
  { kind: 'charm', charm: 'payday' },
  { kind: 'handSize' },
]

describe('M12.11 — screen smoke tests (render from valid RunState without throwing)', () => {
  beforeAll(() => {
    // The jsdom localStorage (Node --localstorage-file) lacks the standard
    // API; the store only uses getItem/setItem, so stub it with the in-memory
    // helper (same as the saveLoad suite).
    vi.stubGlobal('localStorage', makeLocalStorage())
  })

  afterEach(() => {
    cleanup()
  })

  it('menu renders from the menu phase', () => {
    useRunStore.getState().toMenu()
    const { container } = render(<MenuScreen />)
    expect(container.querySelector('h1')?.textContent).toBe('50/50')
    expect(screen.getByRole('button', { name: /new run/i })).toBeTruthy()
    // No save → the Resume button is absent.
    expect(screen.queryByRole('button', { name: /resume/i })).toBeNull()
  })

  it('run renders from a drawn hand (play phase)', () => {
    useRunStore.getState().startRun('smoke-run')
    useRunStore.getState().drawHand()
    const { container } = render(<RunScreen />)
    expect(container.querySelector('.blind-header')).toBeTruthy()
    expect(container.querySelectorAll('.play-slot')).toHaveLength(5)
    expect(container.querySelectorAll('.hand-coin')).toHaveLength(8)
    expect(screen.getByRole('button', { name: /confirm/i })).toBeTruthy()
  })

  it('shop renders from the shop phase with offers', () => {
    useRunStore.getState().startRun('smoke-shop')
    useRunStore.setState({ phase: 'shop', shop: { offers: OFFERS } })
    const { container } = render(<ShopScreen />)
    expect(container.querySelector('.shop-title')?.textContent).toBe('Shop')
    expect(container.querySelectorAll('.offer-tile')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /leave/i })).toBeTruthy()
  })

  it('run-end renders from a won run', () => {
    useRunStore.getState().startRun('smoke-win')
    useRunStore.setState({ phase: 'runEnd', won: true, runScore: 1234, cash: 20, blindScore: 500 })
    const { container } = render(<RunEndScreen />)
    expect(container.querySelector('.run-end-title')?.textContent).toBe('Run complete!')
    expect(screen.getByText('1234')).toBeTruthy()
  })

  it('run-end renders from a lost run', () => {
    useRunStore.getState().startRun('smoke-lose')
    useRunStore.setState({ phase: 'runEnd', won: false, runScore: 400, cash: 8, blindScore: 100, blindIndex: 3 })
    const { container } = render(<RunEndScreen />)
    expect(container.querySelector('.run-end-title')?.textContent).toBe('Game over')
    expect(screen.getByText('3 / 12')).toBeTruthy() // blinds cleared
  })
})
