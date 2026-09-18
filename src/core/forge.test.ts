// 13a.14 — Forge special interactions (core/forge, pure).
//
// The starter set: draw stacks (cap 3), weight pairs (certainty / cancel),
// heads + tails → chaos, chaos + chaos / reverse + reverse → plain,
// tax + tax → jackpot. No match → the plain stack. One rule per merge (the
// first in table order); unmatched effects carry over.

import { describe, expect, it } from 'vitest'
import { effectName, forgeCoin, forgeRuleLabel, FORGE_RULES } from './forge'
import type { Coin, CoinEffect } from './types'

const coin = (effects: CoinEffect[]): Coin => ({ id: 1, effects })
const wH: CoinEffect = { kind: 'weight', favored: 'H' }
const wT: CoinEffect = { kind: 'weight', favored: 'T' }
const heads: CoinEffect = { kind: 'heads' }
const tails: CoinEffect = { kind: 'tails' }
const chaos: CoinEffect = { kind: 'chaos' }
const reverse: CoinEffect = { kind: 'reverse' }
const tax: CoinEffect = { kind: 'tax' }
const jackpot: CoinEffect = { kind: 'jackpot' }
const draw = (count: 1 | 2 | 3): CoinEffect => ({ kind: 'draw', count })

describe('draw — stacks, capped at 3', () => {
  it('draw-1 + draw-1 → draw-2', () => {
    expect(forgeCoin(coin([draw(1)]), coin([draw(1)]))).toEqual({
      effects: [{ kind: 'draw', count: 2 }],
      special: expect.anything(),
    })
  })

  it('draw-1 + draw-2 → draw-3', () => {
    expect(forgeCoin(coin([draw(1)]), coin([draw(2)])).effects).toEqual([{ kind: 'draw', count: 3 }])
  })

  it('draw-2 + draw-2 → draw-3 (the cap)', () => {
    expect(forgeCoin(coin([draw(2)]), coin([draw(2)])).effects).toEqual([{ kind: 'draw', count: 3 }])
  })

  it('draw-1 + draw-3 → draw-3 (the cap)', () => {
    expect(forgeCoin(coin([draw(1)]), coin([draw(3)])).effects).toEqual([{ kind: 'draw', count: 3 }])
  })
})

describe('weight pairs', () => {
  it('weight(H) + weight(H) → heads', () => {
    expect(forgeCoin(coin([wH]), coin([wH])).effects).toEqual([heads])
  })

  it('weight(T) + weight(T) → tails', () => {
    expect(forgeCoin(coin([wT]), coin([wT])).effects).toEqual([tails])
  })

  it('weight(H) + weight(T) → plain (cancels)', () => {
    expect(forgeCoin(coin([wH]), coin([wT])).effects).toEqual([])
  })
})

describe('opposing certainties + cancellations', () => {
  it('heads + tails → chaos (either order)', () => {
    expect(forgeCoin(coin([heads]), coin([tails])).effects).toEqual([chaos])
    expect(forgeCoin(coin([tails]), coin([heads])).effects).toEqual([chaos])
  })

  it('chaos + chaos → plain', () => {
    expect(forgeCoin(coin([chaos]), coin([chaos])).effects).toEqual([])
  })

  it('reverse + reverse → plain', () => {
    expect(forgeCoin(coin([reverse]), coin([reverse])).effects).toEqual([])
  })
})

describe('cash', () => {
  it('tax + tax → jackpot', () => {
    expect(forgeCoin(coin([tax]), coin([tax])).effects).toEqual([jackpot])
  })
})

describe('plain stack + carry-over', () => {
  it('no matching pair → the plain stack (target first, then source)', () => {
    const out = forgeCoin(coin([tax]), coin([wH, chaos]))
    expect(out.effects).toEqual([wH, chaos, tax])
    expect(out.special).toBeNull()
  })

  it('unmatched effects carry over: [weight(H), tax] + [weight(H)] → [heads, tax]', () => {
    const out = forgeCoin(coin([wH, tax]), coin([wH]))
    expect(out.effects).toEqual([heads, tax])
    expect(out.special).not.toBeNull()
  })

  it('the result effect leads the carried-over effects: [tax] + [tax, weight(H)] → [jackpot, weight(H)]', () => {
    const out = forgeCoin(coin([tax]), coin([tax, wH]))
    // tax + tax → jackpot; the target's weight carries over behind it.
    expect(out.effects).toEqual([jackpot, wH])
  })

  it('one rule per merge — the first in table order fires ([chaos, tax] + [chaos, tax])', () => {
    const out = forgeCoin(coin([chaos, tax]), coin([chaos, tax]))
    // chaos + chaos (earlier in the table) fires; the tax pair stacks.
    expect(out.effects).toEqual([tax, tax])
    expect(out.special?.rule).toBe(FORGE_RULES[5])
  })

  it('a duplicate inside one coin: [chaos, chaos] + [chaos] consumes one pair', () => {
    const out = forgeCoin(coin([chaos, chaos]), coin([chaos]))
    expect(out.effects).toEqual([chaos]) // the leftover chaos carries over
  })
})

describe('UI labels', () => {
  it('effectName names the parameterised effects', () => {
    expect(effectName(wH)).toBe('Weight(H)')
    expect(effectName(draw(2))).toBe('Draw-2')
    expect(effectName(jackpot)).toBe('Jackpot')
  })

  it('forgeRuleLabel reads the fired rule', () => {
    const drawRule = FORGE_RULES[0]
    expect(forgeRuleLabel(drawRule, draw(1), draw(1))).toBe('Draw-1 + Draw-1 → Draw-2')
    const wRule = FORGE_RULES[3]
    expect(forgeRuleLabel(wRule, wH, wT)).toBe('Weight(H) + Weight(T) → plain')
  })
})
