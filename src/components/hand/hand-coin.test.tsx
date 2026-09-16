// @vitest-environment jsdom
// 13.8 — the reduced-motion / a11y path (SDD UX §8): the hand coin is a real
// <button> (full keyboard path: Tab + Enter/Space), carries an ARIA label,
// and the hover tilt is OFF under prefers-reduced-motion (no hover tilt,
// UX §8). H/T carry a glyph, never color alone (colorblind-safe, UX §8).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { Coin } from '@/core/types'
import { HandCoin } from './hand-coin'
import { CoinDisc } from './coin-disc'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  run.juice.test.tsx): motion-dom reads the media query once and subscribes
 *  to its change events; setReduced flips the preference. */
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
    addListener: (fn: () => void) => listeners.push(fn),
    removeListener: (fn: () => void) => {
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

afterEach(() => {
  cleanup()
  reduced.setReduced(false)
})

const coin: Coin = { id: 1, effects: [] }

describe('13.8 — the hand coin a11y path (UX §8)', () => {
  it('is a real <button> (full keyboard path) with an ARIA label', () => {
    const { container } = render(<HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />)
    const btn = container.querySelector('button')
    expect(btn).toBeTruthy()
    expect(btn?.getAttribute('aria-label')).toContain('Pick coin 1')
  })

  it('clicking (Enter/Space on the button) picks the coin', () => {
    const onPick = vi.fn()
    const { container } = render(<HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={onPick} />)
    fireEvent.click(container.querySelector('button')!)
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick.mock.calls[0][0]).toBeInstanceOf(HTMLElement)
  })

  it('the hover tilt follows the pointer (normal motion)', () => {
    // jsdom rects are 0×0 (the tilt math divides by the width) — give the
    // button a real size.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => {},
    } as DOMRect)
    const { container } = render(<HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />)
    const btn = container.querySelector('button')!
    const tilt = container.querySelector('.hand-coin-tilt') as HTMLDivElement
    fireEvent.pointerMove(btn, { clientX: 10, clientY: 10 })
    expect(tilt.style.transform).toContain('rotateX')
    expect(tilt.style.transform).toContain('rotateY')
  })

  it('reduced motion: no hover tilt (UX §8)', () => {
    reduced.setReduced(true)
    const { container } = render(<HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />)
    const btn = container.querySelector('button')!
    const tilt = container.querySelector('.hand-coin-tilt') as HTMLDivElement
    fireEvent.pointerMove(btn, { clientX: 10, clientY: 10 })
    expect(tilt.style.transform).toBe('')
  })

  it('H/T carry a glyph + ARIA label, never color alone (colorblind-safe)', () => {
    const { container } = render(
      <>
        <CoinDisc face="H" />
        <CoinDisc face="T" />
      </>,
    )
    const [h, t] = container.querySelectorAll('.coin-disc')
    expect(h.textContent).toBe('H')
    expect(t.textContent).toBe('T')
    expect(h.getAttribute('aria-label')).toBe('heads')
    expect(t.getAttribute('aria-label')).toBe('tails')
    // 13a.9 — the face color is part of the signal (glyph + color, never
    // color alone): the disc class keys off the full face word.
    expect(h.classList.contains('coin-disc--heads')).toBe(true)
    expect(t.classList.contains('coin-disc--tails')).toBe(true)
  })

  it('13a.9 — a Weight coin shows its favored face on the badge', () => {
    const { container } = render(
      <HandCoin coin={{ id: 2, effects: [{ kind: 'weight', favored: 'H' }] }} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />,
    )
    expect(container.querySelector('.coin-badge')?.textContent).toBe('W')
    expect(container.querySelector('.face-badge--heads')?.textContent).toBe('H')
  })
})
