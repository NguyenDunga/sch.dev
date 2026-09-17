// Coin resolver tests — the chain resolver with priority modifiers.
//
// Verifies:
// - Base face colors (H/T)
// - Single effect modifiers
// - Multi-effect priority (higher priority wins)
// - Color override (last wins)
// - Border/glow override (last wins)
// - Custom class accumulation
// - Both sides resolve independently

import { describe, expect, it } from 'vitest'
import { resolveCoinFace, resolveCoinFaces } from './resolver'
import { knownFace } from '../facedown-backs'
import type { CoinEffect } from '@/core/types'

// Helper: build a CoinEffect for testing
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
    expect(r.border).toBe('')
    expect(r.glow).toBe('')
    expect(r.customClasses).toEqual([])
  })

  it('base T face: tails color, no modifiers', () => {
    const r = resolveCoinFace({ face: 'T', effects: [] })
    expect(r.face).toBe('T')
    expect(r.color).toBe('var(--tails)')
  })

  // ── Single effects ─────────────────────────────────────────────────────
  it('weight H on H face: favored color', () => {
    const r = resolveCoinFace({ face: 'H', effects: [weight('H')] })
    expect(r.color).toContain('var(--heads)')
  })

  it('weight H on T face: base color (no modifier)', () => {
    const r = resolveCoinFace({ face: 'T', effects: [weight('H')] })
    expect(r.color).toBe('var(--tails)')
  })

  it('heads on H face: lightened fill + heads glow', () => {
    const r = resolveCoinFace({ face: 'H', effects: [heads()] })
    expect(r.color).toContain('var(--heads)')
    expect(r.glow).toContain('var(--heads)')
  })

  it('tails on T face: lightened fill + tails glow', () => {
    const r = resolveCoinFace({ face: 'T', effects: [tails()] })
    expect(r.color).toContain('var(--tails)')
    expect(r.glow).toContain('var(--tails)')
  })

  it('face-down plain coin: generic sunk back', () => {
    const r = resolveCoinFace({ face: undefined, effects: [] })
    expect(r.color).toBe('var(--surface-sunk)')
    expect(r.border).toBe('')
    expect(r.glow).toBe('')
    expect(r.customClasses).toEqual([])
  })

  it('face-down Weight-H: pre-displays heads (gold back)', () => {
    const r = resolveCoinFace({ face: undefined, effects: [weight('H')] })
    expect(r.color).toContain('var(--heads)')
    expect(r.border).toContain('var(--heads)')
  })

  it('face-down Weight-T: pre-displays tails (slate back)', () => {
    const r = resolveCoinFace({ face: undefined, effects: [weight('T')] })
    expect(r.color).toContain('var(--tails)')
    expect(r.border).toContain('var(--tails)')
  })

  it('face-down Heads: pre-displays heads (guaranteed)', () => {
    const r = resolveCoinFace({ face: undefined, effects: [heads()] })
    expect(r.color).toContain('var(--heads)')
  })

  it('face-down Tails: pre-displays tails (guaranteed)', () => {
    const r = resolveCoinFace({ face: undefined, effects: [tails()] })
    expect(r.color).toContain('var(--tails)')
  })

  it('face-down effect coin: per-effect back (jackpot = gold glow + border)', () => {
    const r = resolveCoinFace({ face: undefined, effects: [jackpot()] })
    expect(r.glow).toContain('var(--tier-jackpot)')
    expect(r.border).toContain('var(--tier-jackpot)')
  })

  it('face-down multi-effect: top-priority effect back wins', () => {
    const r = resolveCoinFace({ face: undefined, effects: [weight('H'), jackpot()] })
    // Jackpot (priority 9) is the top effect → its back wins over weight (2)
    expect(r.glow).toContain('var(--tier-jackpot)')
  })

  // ── Face-down pre-display (Magnetic) ─────────────────────────────────
  it('predisplayFace=H: Facedown-Head back overrides the effect back', () => {
    const r = resolveCoinFace({ face: undefined, effects: [magnetic()], predisplayFace: 'H' })
    expect(r.color).toContain('var(--heads)')
    expect(r.border).toContain('var(--heads)')
  })

  it('predisplayFace=T: Facedown-Tail back', () => {
    const r = resolveCoinFace({ face: undefined, effects: [magnetic()], predisplayFace: 'T' })
    expect(r.color).toContain('var(--tails)')
    expect(r.border).toContain('var(--tails)')
  })

  it('predisplayFace is ignored when face-up', () => {
    const r = resolveCoinFace({ face: 'H', effects: [magnetic()], predisplayFace: 'T' })
    expect(r.color).toBe('var(--heads)')
  })

  it('no predisplayFace: Magnetic uses its own back', () => {
    const r = resolveCoinFace({ face: undefined, effects: [magnetic()] })
    expect(r.color).toBe('var(--surface-sunk)')
  })

  // ── knownFace ────────────────────────────────────────────────────────
  it('knownFace: Weight → favoured face', () => {
    expect(knownFace([weight('H')])).toBe('H')
    expect(knownFace([weight('T')])).toBe('T')
  })

  it('knownFace: Heads → H, Tails → T', () => {
    expect(knownFace([heads()])).toBe('H')
    expect(knownFace([tails()])).toBe('T')
  })

  it('knownFace: first known-face effect wins', () => {
    expect(knownFace([weight('H'), tails()])).toBe('H')
    expect(knownFace([tax(), weight('T')])).toBe('T')
  })

  it('knownFace: no known face → undefined', () => {
    expect(knownFace([])).toBeUndefined()
    expect(knownFace([tax(), chaos()])).toBeUndefined()
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

  it('magnetic: solid border', () => {
    const r = resolveCoinFace({ face: 'H', effects: [magnetic()] })
    expect(r.border).toContain('solid')
  })

  it('reverse: hue-invert class', () => {
    const r = resolveCoinFace({ face: 'H', effects: [reverse()] })
    expect(r.customClasses).toContain('coin-face--reverse')
  })

  it('tax: dim + red tint', () => {
    const r = resolveCoinFace({ face: 'H', effects: [tax()] })
    expect(r.color).toContain('var(--danger)')
  })

  it('jackpot: gold glow + border', () => {
    const r = resolveCoinFace({ face: 'H', effects: [jackpot()] })
    expect(r.color).toContain('var(--tier-jackpot)')
    expect(r.glow).toContain('var(--tier-jackpot)')
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
  })

  it('weight + reverse: color + class combine', () => {
    const r = resolveCoinFace({ face: 'H', effects: [weight('H'), reverse()] })
    // weight H on H: favored color; reverse: hue-invert class
    expect(r.color).toContain('var(--heads)')
    expect(r.customClasses).toContain('coin-face--reverse')
  })

  it('tax + jackpot: jackpot wins color (higher priority)', () => {
    const r = resolveCoinFace({ face: 'H', effects: [tax(), jackpot()] })
    // tax (priority 8) sets danger color, jackpot (priority 9) overrides
    expect(r.color).toContain('var(--tier-jackpot)')
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
    // H face: favored color; T face: base color (no modifier)
    expect(H.color).toContain('var(--heads)')
    expect(T.color).toBe('var(--tails)')
  })

  it('resolveCoinFaces: no effects → both sides base', () => {
    const { H, T } = resolveCoinFaces([])
    expect(H.color).toBe('var(--heads)')
    expect(T.color).toBe('var(--tails)')
  })

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('empty effects: base state', () => {
    const r = resolveCoinFace({ face: 'H', effects: [] })
    expect(r.modifiers).toEqual([])
  })

  it('all effects: no crash, deterministic output', () => {
    const all: CoinEffect[] = [
      weight('H'), heads(), tails(), chaos(), echo(),
      magnetic(), reverse(), tax(), jackpot(), draw(2),
    ]
    const r1 = resolveCoinFace({ face: 'H', effects: all })
    const r2 = resolveCoinFace({ face: 'H', effects: all })
    // Deterministic: same input → same output
    expect(r1.color).toBe(r2.color)
    expect(r1.border).toBe(r2.border)
    expect(r1.glow).toBe(r2.glow)
    expect(r1.customClasses).toEqual(r2.customClasses)
  })
})
