// @vitest-environment jsdom
//
// 13a.9 — Show each coin's favored face:
//   - a Weight coin's badge shows its favored face (H/T) right after the W
//   - a Double-Side coin's badge shows its favored face after the DS
//   - plain effects are unchanged (no face badge)
//   - a merged coin shows every effect's favored face
//   - the tooltip names the favored face
//
// 13c.4 — the cryptic single-letter glyphs are replaced with registry icons.
// The tests now check for the icon elements (SVG) + the face badges.

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { CoinEffect } from '@/core/types'
import { CoinBadges } from './coin-badges'

afterEach(cleanup)

const WEIGHT_H: CoinEffect = { kind: 'weight', favored: 'H' }
const WEIGHT_T: CoinEffect = { kind: 'weight', favored: 'T' }
const DOUBLE_T: CoinEffect = { kind: 'doubleSide', favored: 'T' }
const TAX: CoinEffect = { kind: 'tax' }
const ECHO: CoinEffect = { kind: 'echo' }

describe('13a.9 — favored-face badges', () => {
  it('a Weight(H) coin shows the Weight icon plus a Heads face badge', () => {
    render(<CoinBadges effects={[WEIGHT_H]} />)
    // The Weight icon (an SVG in the .coin-badge).
    expect(document.querySelector('.coin-badge svg')).toBeTruthy()
    // The favored-face pill (Heads icon, heads color).
    const face = document.querySelector('.face-badge--heads svg')
    expect(face).toBeTruthy()
  })

  it('a Weight(T) coin shows the Weight icon plus a Tails face badge', () => {
    render(<CoinBadges effects={[WEIGHT_T]} />)
    expect(document.querySelector('.coin-badge svg')).toBeTruthy()
    expect(document.querySelector('.face-badge--tails svg')).toBeTruthy()
  })

  it('a Double-Side coin shows the Double-Side icon plus its favored face', () => {
    render(<CoinBadges effects={[DOUBLE_T]} />)
    expect(document.querySelector('.coin-badge svg')).toBeTruthy()
    expect(document.querySelector('.face-badge--tails svg')).toBeTruthy()
  })

  it('plain effects are unchanged (no face badge)', () => {
    render(<CoinBadges effects={[TAX, ECHO]} />)
    // Two effect icons (Tax + Echo).
    expect(document.querySelectorAll('.coin-badge svg').length).toBe(2)
    expect(document.querySelector('.face-badge')).toBeNull()
  })

  it('a merged coin shows every effect and its favored face', () => {
    render(<CoinBadges effects={[WEIGHT_H, DOUBLE_T]} />)
    // Two effect icons (Weight + Double-Side).
    expect(document.querySelectorAll('.coin-badge svg').length).toBe(2)
    expect(document.querySelector('.face-badge--heads svg')).toBeTruthy()
    expect(document.querySelector('.face-badge--tails svg')).toBeTruthy()
  })

  it('the tooltip names the favored face', () => {
    const { unmount } = render(<CoinBadges effects={[WEIGHT_H]} />)
    expect(screen.getAllByTitle(/weight/i)[0].getAttribute('title')).toMatch(/heads/i)
    unmount()
    render(<CoinBadges effects={[DOUBLE_T]} />)
    expect(screen.getAllByTitle(/double-side/i)[0].getAttribute('title')).toMatch(/tails/i)
  })

  it('no effects renders nothing', () => {
    const { container } = render(<CoinBadges effects={[]} />)
    expect(container.querySelector('.coin-badges')).toBeNull()
  })
})
