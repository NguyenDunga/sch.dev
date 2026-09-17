// @vitest-environment jsdom
// 13.8 — the reduced-motion / a11y path (SDD UX §8): the hand coin is a real
// <button> (full keyboard path: Tab + Enter/Space), carries an ARIA label,
// and hover has no 3D tilt (the pick-up lift is CSS, UX §3). H/T carry a
// glyph, never color alone (colorblind-safe, UX §8).

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import type { Coin } from '@/core/types'
import { HandCoin } from './hand-coin'
import { Coin as CoinVisual } from '../coin'

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** true if the transform carries a non-zero rotateX/rotateY (a tilt). */
function hasNonZeroRotation(transform: string): boolean {
  const rx = transform.match(/rotateX\((-?[\d.]+)deg\)/)
  const ry = transform.match(/rotateY\((-?[\d.]+)deg\)/)
  return (rx !== null && parseFloat(rx[1]) !== 0) || (ry !== null && parseFloat(ry[1]) !== 0)
}

afterEach(() => {
  cleanup()
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

  it('hover: no 3D tilt — the pick-up is a CSS translate (M19 follow-up)', async () => {
    // jsdom rects are 0×0 — give the button a real size.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => {},
    } as DOMRect)
    const { container } = render(<HandCoin coin={coin} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />)
    const btn = container.querySelector('button')!
    const lift = container.querySelector('.coin') as HTMLDivElement
    fireEvent.pointerMove(btn, { clientX: 10, clientY: 10 })
    // The 3D pointer tilt is gone: the transform carries no rotateX/rotateY
    // (the pick-up lift is a CSS `translate`, not a Motion transform).
    await wait(150)
    expect(hasNonZeroRotation(lift.style.transform)).toBe(false)
  })

  it('H/T carry an icon + ARIA label, never color alone (colorblind-safe)', () => {
    const { container } = render(
      <>
        <CoinVisual face="H" effects={[]} />
        <CoinVisual face="T" effects={[]} />
      </>,
    )
    const [h, t] = Array.from(container.querySelectorAll('.coin')) as HTMLElement[]
    // 13c.3 — the face is an icon (an SVG), not a text glyph.
    expect(h.querySelector('svg')).toBeTruthy()
    expect(t.querySelector('svg')).toBeTruthy()
    expect(h.querySelector('.coin-glyph-solo')?.getAttribute('aria-label')).toBe('Heads')
    expect(t.querySelector('.coin-glyph-solo')?.getAttribute('aria-label')).toBe('Tails')
    // 13a.9 — the face color is part of the signal (icon + color, never
    // color alone): the shell's face fill keys off the full face.
    expect((h.querySelector('.coin-shell-face') as HTMLElement).style.background).toContain('heads')
    expect((t.querySelector('.coin-shell-face') as HTMLElement).style.background).toContain('tails')
  })

  it('13a.9 — a multi-effect coin shows its RadialReveal glyph (ring + disk, M19)', () => {
    const { container } = render(
      <HandCoin coin={{ id: 2, effects: [{ kind: 'weight', favored: 'H' }, { kind: 'jackpot' }] }} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />,
    )
    // M19 — the glyph is a RadialReveal (a conic-gradient ring around a disk).
    // The ring has one wedge per NON-top effect (the top effect is the disk
    // default, so it gets no wedge): 2 effects → 1 wedge.
    const glyph = container.querySelector('.radial-reveal')
    expect(glyph).toBeTruthy()
    expect(glyph!.querySelectorAll('.radial-reveal-hits path')).toHaveLength(1)
    // The disk shows the top effect's short name (Jackpot, priority 9).
    expect(glyph!.textContent).toContain('Jackpot')
  })

  it('13a.9 — a single-effect coin shows its glyph directly (no ring, M19)', () => {
    const { container } = render(
      <HandCoin coin={{ id: 3, effects: [{ kind: 'weight', favored: 'H' }] }} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />,
    )
    expect(container.querySelector('.radial-reveal')).toBeNull()
    expect(container.querySelector('.coin-glyph-solo svg')).toBeTruthy()
    // The glyph sits on a light disk (contrast on the solid H / T face fills)
    // with the effect's short name below the icon.
    expect(container.querySelector('.coin-glyph-solo-disk')).toBeTruthy()
    expect(container.querySelector('.coin-glyph-solo-text')!.textContent).toBe('Weight')
  })

  it('13a.9 — a plain coin (no effects) shows the face icon without text', () => {
    const { container } = render(
      <HandCoin coin={{ id: 4, effects: [] }} index={0} enabled shaking={false} shakeKey={0} onPick={() => {}} />,
    )
    // A plain face is its own archetype: the face-state icon, no text.
    expect(container.querySelector('.coin-glyph-solo svg')).toBeTruthy()
    expect(container.querySelector('.coin-glyph-solo-text')).toBeNull()
    expect(container.querySelector('.coin-glyph-solo-disk')).toBeTruthy()
  })
})
