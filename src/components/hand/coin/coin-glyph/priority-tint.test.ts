// Priority tint tests — the RadialReveal wedge color lightness by priority rank.

import { describe, expect, it } from 'vitest'
import { priorityStrength, priorityTint } from './priority-tint'
import type { CoinEffect } from '@/core/types'

function weight(favored: 'H' | 'T'): CoinEffect {
  return { kind: 'weight', favored }
}
function heads(): CoinEffect {
  return { kind: 'heads' }
}
function tails(): CoinEffect {
  return { kind: 'tails' }
}
function chaos(): CoinEffect {
  return { kind: 'chaos' }
}
function jackpot(): CoinEffect {
  return { kind: 'jackpot' }
}
function draw(): CoinEffect {
  return { kind: 'draw', count: 1 }
}

describe('priorityStrength', () => {
  it('single effect → 100 (full color)', () => {
    expect(priorityStrength([heads()], heads())).toBe(100)
  })

  it('two effects: lower priority → lighter, higher → full color', () => {
    const effects = [weight('H'), jackpot()] // weight=2, jackpot=9
    const sWeight = priorityStrength(effects, weight('H'))
    const sJackpot = priorityStrength(effects, jackpot())
    expect(sWeight).toBeLessThan(sJackpot)
    expect(sJackpot).toBe(100) // top effect is always full color
  })

  it('strength increases with priority rank', () => {
    const effects = [weight('H'), chaos(), jackpot(), draw()] // 2, 4, 9, 10
    const sWeight = priorityStrength(effects, weight('H'))
    const sChaos = priorityStrength(effects, chaos())
    const sJackpot = priorityStrength(effects, jackpot())
    const sDraw = priorityStrength(effects, draw())
    expect(sWeight).toBeLessThan(sChaos)
    expect(sChaos).toBeLessThan(sJackpot)
    expect(sJackpot).toBeLessThan(sDraw)
  })

  it('tied priorities share a strength', () => {
    const effects = [heads(), tails(), draw()] // heads=3, tails=3, draw=10
    expect(priorityStrength(effects, heads())).toBe(priorityStrength(effects, tails()))
  })
})

describe('priorityTint', () => {
  it('100 → unchanged', () => {
    expect(priorityTint('#e8b04b', 100)).toBe('#e8b04b')
  })

  it('<100 → color-mix with white', () => {
    expect(priorityTint('#e8b04b', 45)).toBe('color-mix(in srgb, #e8b04b 45%, white)')
  })
})
