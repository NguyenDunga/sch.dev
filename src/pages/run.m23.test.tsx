// @vitest-environment jsdom
//
// M23 — responsive rework, interaction + layout gates:
//   - the full hand is playable by TAP ALONE (no drag, no keyboard):
//     tap coins to pick, tap a play slot to unpick, tap the well to discard
//   - the well tap-discard: the last picked coin (or the selection) is
//     discarded; with nothing to discard the tap still toggles the pile panel
//   - the responsive topology lives in Tailwind utilities on the screens
//     (md:/lg: + the landscape-short custom variant)
//
// The pointer drag itself (dnd-kit) needs real pointer geometry — the
// tap paths share the same store actions (M4 hand-phase).

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import { RunScreen } from './run'
import { MenuScreen } from './menu'
import { ShopScreen } from './shop'
import { RunEndScreen } from './run-end'
import type { ShopOffer } from '@/core/types'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.13a5.test.tsx). */
const reduced = (() => {
  const listeners: Array<() => void> = []
  const mql = {
    matches: false,
    media: '(prefers-reduced-motion)',
    addEventListener: (_event: string, fn: () => void) => listeners.push(fn),
    removeEventListener: (fn: () => void) => {
      const i = listeners.indexOf(fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  }
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))
  return {
    setReduced: (r: boolean) => {
      mql.matches = r
      listeners.forEach((fn) => fn())
    },
  }
})()

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(() => {
  cleanup()
  reduced.setReduced(false)
})

/** Fresh run with a drawn hand (skip the draw phase). */
function freshRun(seed: string): void {
  useRunStore.getState().startRun(seed)
  useRunStore.getState().drawHand()
  render(<RunScreen />)
}

function handCoins(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('.hand-coin')]
}

describe('M23 — tap-only play (no drag, no keyboard)', () => {
  it('five taps pick five coins into the play row', () => {
    freshRun('m23-tap-pick')
    for (const coin of handCoins().slice(0, 5)) fireEvent.click(coin)
    const s = useRunStore.getState()
    expect(s.play.filter((p) => p.kind === 'filled')).toHaveLength(5)
    expect(s.hand.filter((h) => h.kind === 'filled')).toHaveLength(3)
  })

  it('tapping a play slot unpicks (tap-to-place both ways)', async () => {
    freshRun('m23-tap-unpick')
    fireEvent.click(handCoins()[0])
    expect(useRunStore.getState().play[0].kind).toBe('filled')
    // The double-click quick-play guard ignores an unpick <350ms after the pick.
    await new Promise((r) => setTimeout(r, 400))
    fireEvent.click(screen.getByRole('button', { name: 'slot 1, unpick' }))
    expect(useRunStore.getState().play[0].kind).toBe('empty')
  })

  it('tapping the well discards the last picked coin (the touch discard)', () => {
    freshRun('m23-tap-discard')
    fireEvent.click(handCoins()[0])
    const picked = useRunStore.getState().play[0]
    expect(picked.kind).toBe('filled')

    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))

    const s = useRunStore.getState()
    expect(s.play[0].kind).toBe('empty')
    expect(s.deck.discardPile).toHaveLength(1)
    if (picked.kind === 'filled') expect(s.deck.discardPile[0].id).toBe(picked.coin.id)
    // the tap caused a discard — the pile panel must NOT have toggled open
    expect(screen.queryByRole('dialog', { name: 'Discard pile' })).toBeNull()
  })

  it('tapping the well with a selection discards the selection', () => {
    freshRun('m23-tap-discard-sel')
    // Ctrl+click selects (the multi-select path); the well tap discards it.
    fireEvent.click(handCoins()[0], { ctrlKey: true })
    fireEvent.click(handCoins()[1], { ctrlKey: true })
    expect(useRunStore.getState().hand.filter((h) => h.kind === 'filled')).toHaveLength(8)

    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))

    const s = useRunStore.getState()
    expect(s.deck.discardPile).toHaveLength(2)
    expect(s.hand.filter((h) => h.kind === 'filled')).toHaveLength(6)
    expect(screen.queryByRole('dialog', { name: 'Discard pile' })).toBeNull()
  })

  it('tapping the well with nothing to discard still toggles the pile panel', () => {
    freshRun('m23-well-panel')
    fireEvent.click(screen.getByRole('button', { name: 'Show discard pile' }))
    expect(screen.getByRole('dialog', { name: 'Discard pile' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog', { name: 'Discard pile' })).toBeNull()
  })
})

describe('M23 — responsive topology (Tailwind utilities on the screens)', () => {
  it('run screen: md widening, lg two-column, landscape-short compact', () => {
    freshRun('m23-run-classes')
    const main = document.querySelector('main.run-screen')!
    expect(main.className).toContain('md:max-w-[52rem]')
    expect(main.className).toContain('lg:grid-cols-')
    expect(main.className).toContain('lg:[grid-template-areas:')
    expect(main.className).toContain('landscape-short:gap-2')
  })

  it('menu / shop / run-end widen at md+', () => {
    useRunStore.getState().toMenu()
    const menu = render(<MenuScreen />).container.querySelector('main.menu-screen')!
    expect(menu.className).toContain('md:max-w-[52rem]')

    useRunStore.getState().startRun('m23-shop')
    const offers: ShopOffer[] = [{ kind: 'handSize' }]
    useRunStore.setState({ phase: 'shop', shop: { offers } })
    const shop = render(<ShopScreen />).container.querySelector('main.shop-screen')!
    expect(shop.className).toContain('md:max-w-[52rem]')

    useRunStore.setState({ phase: 'runEnd', won: true, runScore: 1, cash: 1, blindScore: 1 })
    const end = render(<RunEndScreen />).container.querySelector('main.run-end')!
    expect(end.className).toContain('md:max-w-[36rem]')
  })
})
