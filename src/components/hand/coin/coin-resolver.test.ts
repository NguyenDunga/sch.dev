// Coin resolver tests — the chain resolver with priority modifiers.
//
// Verifies:
// - Base face colors (H/T)
// - Single effect modifiers
// - Multi-effect priority (higher priority wins)
// - Tilt accumulation
// - Scale multiplication
// - Color override (last wins)
// - Border/glow override (last wins)
// - Custom class accumulation
// - Both sides resolve independently

import { describe, expect, it } from 'vitest'
import { resolveCoinFace, resolveCoinFaces } from './coin-resolver'
import type { CoinEffect } from '@/core/types'

// Helper: build a CoinEffect for testing
function weight(favored: 'H' | 'T'): CoinEffect {
  return { kind: 'weight', favored }
}
function doubleSide(favored: 'H' | 'T'): CoinEffect {
  return { kind: 'doubleSide', favored }
}
function chaos(): CoinEffect {
  return { kind: 'chaos' }
}
function echo(): CoinEffect {
  return { kind: 'echo' }
}
function magnetic(): CoinEffect {
  return { kind: 'magnetic' }
}
function reverse(): CoinEffect {
  return { kind: 'reverse' }
}
function tax(): CoinEffect {
  return { kind: 'tax' }
}
function jackpot(): CoinEffect {
  return { kind: 'jackpot' }
}
function draw(count: 1 | 2 | 3): CoinEffect {
  return { kind: 'draw', count }
}

describe('coin-resolver', () => {
  // ── Base face ──────────────────────────────────────────────────────────
  it('base H face: heads color, no modifiers', () => {
    const r = resolveCoinFace({ face: 'H', effects: [] })
    expect(r.face).toBe('H')
    expect(r.color).toBe('var(--heads)')
    expect(r.tilt).toBe(0)
    expect(r.scale).toBe(1)
    expect(r.border).toBe('')
    expect(r.glow).toBe('')
    expect(r.customClasses).toEqual([])
  })

  it('base T face: tails color, no modifiers', () => {
    const r = resolveCoinFace({ face: 'T', effects: [] })
    expect(r.face).toBe('T')
    expect(r.color).toBe('var(--tails)')
    expect(r.tilt).toBe(0)
    expect(r.scale).toBe(1)
  })

  // ── Single effects ─────────────────────────────────────────────────────
  it('weight H on H face: tilt right', () => {
    const r = resolveCoinFace({ face: 'H', effects: [weight('H')] })
    expect(r.tilt).toBe(12)
  })

  it('weight H on T face: tilt left (opposite)', () => {
    const r = resolveCoinFace({ face: 'T', effects: [weight('H')] })
    expect(r.tilt).toBe(-4)
  })

  it('doubleSide H on H face: strong tilt + glow', () => {
    const r = resolveCoinFace({ face: 'H', effects: [doubleSide('H')] })
    expect(r.tilt).toBe(18)
    expect(r.glow).toContain('var(--heads)')
  })

  it('chaos: dashed border + custom class', () => {
    const r = resolveCoinFace({ face: 'H', effects: [chaos()] })
    expect(r.border).toContain('dashed')
    expect(r.customClasses).toContain('coin-face--chaos')
  })

  it('echo: glow + custom class', () => {
    const r = resolveCoinFace({ face: 'H', effects: [echo()] })
    expect(r.glow).toContain('var(--secondary)')
    expect(r.customClasses).toContain('coin-face--echo')
  })

  it('magnetic: solid border + scale up', () => {
    const r = resolveCoinFace({ face: 'H', effects: [magnetic()] })
    expect(r.border).toContain('solid')
    expect(r.scale).toBe(1.05)
  })

  it('reverse: negative tilt', () => {
    const r = resolveCoinFace({ face: 'H', effects: [reverse()] })
    expect(r.tilt).toBe(-8)
  })

  it('tax: dim + red tint + scale down', () => {
    const r = resolveCoinFace({ face: 'H', effects: [tax()] })
    expect(r.color).toContain('var(--danger)')
    expect(r.scale).toBe(0.9)
  })

  it('jackpot: gold glow + scale up + border', () => {
    const r = resolveCoinFace({ face: 'H', effects: [jackpot()] })
    expect(r.color).toContain('var(--tier-jackpot)')
    expect(r.glow).toContain('var(--tier-jackpot)')
    expect(r.scale).toBe(1.1)
    expect(r.border).toContain('var(--tier-jackpot)')
  })

  it('draw: count color border', () => {
    const r = resolveCoinFace({ face: 'H', effects: [draw(3)] })
    expect(r.border).toContain('var(--tier-jackpot)')
    expect(r.customClasses).toContain('coin-face--draw-3')
  })

  // ── Multi-effect priority ──────────────────────────────────────────────
  it('weight + jackpot: jackpot wins (higher priority)', () => {
    const r = resolveCoinFace({ face: 'H', effects: [weight('H'), jackpot()] })
    // Jackpot (priority 9) overrides weight (priority 2) for color
    expect(r.color).toContain('var(--tier-jackpot)')
    // Tilt accumulates: 12 (weight) + 0 (jackpot has no tilt) = 12
    expect(r.tilt).toBe(12)
    // Scale multiplies: 1 (weight) * 1.1 (jackpot) = 1.1
    expect(r.scale).toBeCloseTo(1.1)
  })

  it('weight + reverse: tilt accumulates', () => {
    const r = resolveCoinFace({ face: 'H', effects: [weight('H'), reverse()] })
    // weight H on H: +12, reverse: -8 → total +4
    expect(r.tilt).toBe(4)
  })

  it('tax + jackpot: jackpot wins color (higher priority)', () => {
    const r = resolveCoinFace({ face: 'H', effects: [tax(), jackpot()] })
    // tax (priority 8) sets danger color, jackpot (priority 9) overrides
    expect(r.color).toContain('var(--tier-jackpot)')
    // Scale: 0.9 * 1.1 = 0.99
    expect(r.scale).toBeCloseTo(0.99)
  })

  it('multiple effects: custom classes accumulate', () => {
    const r = resolveCoinFace({ face: 'H', effects: [chaos(), echo()] })
    expect(r.customClasses).toContain('coin-face--chaos')
    expect(r.customClasses).toContain('coin-face--echo')
    expect(r.customClasses.length).toBe(2)
  })

  // ── Both sides ─────────────────────────────────────────────────────────
  it('resolveCoinFaces: H and T resolve independently', () => {
    const { H, T } = resolveCoinFaces([weight('H')])
    // H face: tilt right (favored)
    expect(H.tilt).toBe(12)
    // T face: tilt left (opposite)
    expect(T.tilt).toBe(-4)
    // Different base colors
    expect(H.color).toContain('var(--heads)')
    expect(T.color).toContain('var(--tails)')
  })

  it('resolveCoinFaces: no effects → both sides base', () => {
    const { H, T } = resolveCoinFaces([])
    expect(H.color).toBe('var(--heads)')
    expect(T.color).toBe('var(--tails)')
    expect(H.tilt).toBe(0)
    expect(T.tilt).toBe(0)
  })

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('empty effects: base state', () => {
    const r = resolveCoinFace({ face: 'H', effects: [] })
    expect(r.modifiers).toEqual([])
  })

  it('all 9 effects: no crash, deterministic output', () => {
    const all: CoinEffect[] = [
      weight('H'), doubleSide('H'), chaos(), echo(),
      magnetic(), reverse(), tax(), jackpot(), draw(2),
    ]
    const r1 = resolveCoinFace({ face: 'H', effects: all })
    const r2 = resolveCoinFace({ face: 'H', effects: all })
    // Deterministic: same input → same output
    expect(r1.color).toBe(r2.color)
    expect(r1.tilt).toBe(r2.tilt)
    expect(r1.scale).toBe(r2.scale)
    expect(r1.border).toBe(r2.border)
    expect(r1.glow).toBe(r2.glow)
    expect(r1.customClasses).toEqual(r2.customClasses)
  })
})
