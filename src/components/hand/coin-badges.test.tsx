// @vitest-environment jsdom
//
// 13a.9 — Show each coin's favored face:
//   - a Weight coin's badge shows its favored face (H/T) right after the W
//   - a Double-Side coin's badge shows its favored face after the DS
//   - plain effects are unchanged (no face badge)
//   - a merged coin shows every effect's favored face
//   - the tooltip names the favored face

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
  it('a Weight(H) coin shows the W badge plus a Heads face badge', () => {
    render(<CoinBadges effects={[WEIGHT_H]} />)
    expect(screen.getByText('W')).toBeTruthy()
    // The favored-face pill (glyph H, heads color).
    const face = screen.getByText('H', { selector: '.face-badge--heads' })
    expect(face).toBeTruthy()
  })

  it('a Weight(T) coin shows the W badge plus a Tails face badge', () => {
    render(<CoinBadges effects={[WEIGHT_T]} />)
    expect(screen.getByText('W')).toBeTruthy()
    expect(screen.getByText('T', { selector: '.face-badge--tails' })).toBeTruthy()
  })

  it('a Double-Side coin shows the DS badge plus its favored face', () => {
    render(<CoinBadges effects={[DOUBLE_T]} />)
    expect(screen.getByText('DS')).toBeTruthy()
    expect(screen.getByText('T', { selector: '.face-badge--tails' })).toBeTruthy()
  })

  it('plain effects are unchanged (no face badge)', () => {
    render(<CoinBadges effects={[TAX, ECHO]} />)
    expect(screen.getByText('$')).toBeTruthy()
    expect(screen.getByText('E')).toBeTruthy()
    expect(document.querySelector('.face-badge')).toBeNull()
  })

  it('a merged coin shows every effect and its favored face', () => {
    render(<CoinBadges effects={[WEIGHT_H, DOUBLE_T]} />)
    expect(screen.getByText('W')).toBeTruthy()
    expect(screen.getByText('DS')).toBeTruthy()
    expect(screen.getByText('H', { selector: '.face-badge--heads' })).toBeTruthy()
    expect(screen.getByText('T', { selector: '.face-badge--tails' })).toBeTruthy()
  })

  it('the tooltip names the favored face', () => {
    const { unmount } = render(<CoinBadges effects={[WEIGHT_H]} />)
    expect(screen.getByTitle(/weight/i).getAttribute('title')).toMatch(/heads/i)
    unmount()
    render(<CoinBadges effects={[DOUBLE_T]} />)
    expect(screen.getByTitle(/double-side/i).getAttribute('title')).toMatch(/tails/i)
  })

  it('no effects renders nothing', () => {
    const { container } = render(<CoinBadges effects={[]} />)
    expect(container.querySelector('.coin-badges')).toBeNull()
  })
})
