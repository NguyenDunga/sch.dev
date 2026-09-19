// @vitest-environment jsdom
//
// Coin info popover — hover a coin (rest HOVER_DELAY_MS) → the floating panel
// lists each effect (name + blurb); leaving hides it (after the grace, which
// lets the pointer cross onto the panel); hovering the panel keeps it open;
// Esc / the × / an outside click close it. Outside the provider the handlers
// are no-ops.
//
// The show/hide are timer-driven, so the timers are advanced inside `act`
// (the render flush goes through React's scheduler, not the event itself).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CoinInfoProvider } from './coin-info'
import { HOVER_DELAY_MS, HIDE_GRACE_MS, useInfoHover } from './coin-info-context'
import { effectRows } from '@/lib/effect-info'
import type { CoinEffect } from '@/core/types'

const EFFECTS: CoinEffect[] = [{ kind: 'weight', favored: 'H' }, { kind: 'tax' }]

function Surface() {
  const hover = useInfoHover(effectRows(EFFECTS), 'Coin effects')
  return <button type="button" {...hover}>coin</button>
}

const panel = () => screen.queryByRole('dialog', { name: 'Coin effects' })
const advance = (ms: number) => act(async () => { vi.advanceTimersByTime(ms) })

/** Hover the coin long enough for the panel to open. */
async function openPanel() {
  const coin = screen.getByRole('button', { name: 'coin' })
  fireEvent.mouseOver(coin)
  await advance(HOVER_DELAY_MS)
  return coin
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('CoinInfoProvider — hover intent', () => {
  it('shows the panel only after the pointer rests for the delay', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    fireEvent.mouseOver(screen.getByRole('button', { name: 'coin' }))
    await advance(HOVER_DELAY_MS - 1)
    expect(panel()).toBeNull()
    await advance(1)
    const info = screen.getByRole('dialog', { name: 'Coin effects' })
    expect(info).toBeTruthy()
    // One row per effect: the parameter-aware name + the blurb.
    expect(screen.getByText('Weight (Heads 75/25)')).toBeTruthy()
    expect(screen.getByText(/75% chance of its favoured face/)).toBeTruthy()
    expect(screen.getByText('Tax')).toBeTruthy()
    expect(screen.getByText(/cash every time it is played and scored/)).toBeTruthy()
  })

  it('leaving before the delay cancels the show', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    const coin = screen.getByRole('button', { name: 'coin' })
    fireEvent.mouseOver(coin)
    await advance(HOVER_DELAY_MS / 2)
    fireEvent.mouseOut(coin)
    await advance(HOVER_DELAY_MS * 2)
    expect(panel()).toBeNull()
  })

  it('leaving after open hides the panel (after the grace)', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    const coin = await openPanel()
    expect(panel()).toBeTruthy()
    fireEvent.mouseOut(coin)
    await advance(HIDE_GRACE_MS)
    expect(panel()).toBeNull()
  })

  it('moving the pointer onto the panel keeps it open', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    const coin = await openPanel()
    fireEvent.mouseOut(coin)
    fireEvent.mouseOver(screen.getByRole('dialog', { name: 'Coin effects' }))
    await advance(HIDE_GRACE_MS * 2)
    expect(panel()).toBeTruthy()
  })

  it('leaving the panel closes it', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    const coin = await openPanel()
    const info = screen.getByRole('dialog', { name: 'Coin effects' })
    fireEvent.mouseOut(coin)
    fireEvent.mouseOver(info)
    fireEvent.mouseOut(info)
    await advance(0)
    expect(panel()).toBeNull()
  })

  it('a plain coin (no effects) shows the 50/50 note', async () => {
    vi.useFakeTimers()
    function Plain() {
      const hover = useInfoHover([], 'Coin effects')
      return <button type="button" {...hover}>plain</button>
    }
    render(
      <CoinInfoProvider>
        <Plain />
      </CoinInfoProvider>,
    )
    fireEvent.mouseOver(screen.getByRole('button', { name: 'plain' }))
    await advance(HOVER_DELAY_MS)
    expect(screen.getByText(/Plain 50\/50 coin/)).toBeTruthy()
  })

  it('Esc closes the panel', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    await openPanel()
    expect(panel()).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    await advance(0)
    expect(panel()).toBeNull()
  })

  it('the × closes the panel', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    await openPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Close coin info' }))
    await advance(0)
    expect(panel()).toBeNull()
  })

  it('an outside click closes the panel', async () => {
    vi.useFakeTimers()
    render(
      <CoinInfoProvider>
        <Surface />
      </CoinInfoProvider>,
    )
    await openPanel()
    expect(panel()).toBeTruthy()
    fireEvent.mouseDown(document.body)
    await advance(0)
    expect(panel()).toBeNull()
  })

  it('outside the provider the handlers are no-ops (no crash)', async () => {
    vi.useFakeTimers()
    render(<Surface />)
    fireEvent.mouseOver(screen.getByRole('button', { name: 'coin' }))
    await advance(HOVER_DELAY_MS * 2)
    expect(panel()).toBeNull()
  })
})
