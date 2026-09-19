// @vitest-environment node
// Coin registry — completeness (every CoinEffectKind / CoinEffectId covered)
// + the catalog derivation (draw tiers → draw1/2/3) + blurbs carry their own
// param values (no stale hardcoded numbers).

import { describe, expect, it } from 'vitest'
import { COIN_CATALOG, COIN_EFFECTS, coinBlurb, coinPrice } from './coins'
import type { CoinEffectId, CoinEffectKind } from '@/core/types'

const ALL_KINDS: CoinEffectKind[] = [
  'weight', 'heads', 'tails', 'chaos', 'echo', 'magnetic', 'reverse', 'tax', 'jackpot', 'draw',
]
const ALL_CATALOG: CoinEffectId[] = [
  'weight', 'heads', 'tails', 'chaos', 'echo', 'magnetic', 'reverse', 'tax', 'jackpot', 'draw1', 'draw2', 'draw3',
]

describe('COIN_EFFECTS — completeness', () => {
  it('covers every CoinEffectKind with a name, icon, face, blurb', () => {
    for (const kind of ALL_KINDS) {
      const c = COIN_EFFECTS[kind]
      expect(c.name).toBeTruthy()
      expect(c.icon.label).toBeTruthy()
      expect(c.face.H.icon).toBeTruthy()
      expect(c.face.T.icon).toBeTruthy()
      expect(c.face.facedown.icon).toBeTruthy()
      expect(coinBlurb(kind)).toBeTruthy()
    }
  })
})

describe('COIN_CATALOG — the shop catalog', () => {
  it('covers every shop-catalog id with a name + price', () => {
    for (const id of ALL_CATALOG) {
      const def = COIN_CATALOG.find((c) => c.effect === id)
      expect(def?.name).toBeTruthy()
      expect(def?.price).toBeGreaterThan(0)
    }
  })

  it('draw expands to its three tiers; the other kinds keep their base price', () => {
    expect(COIN_CATALOG).toHaveLength(12)
    expect(COIN_CATALOG.find((c) => c.effect === 'draw3')?.name).toBe('Draw-3')
    expect(coinPrice('weight')).toBe(COIN_EFFECTS.weight.price)
    expect(coinPrice('draw2')).toBe(8)
  })
})

describe('blurbs carry their own param values', () => {
  it('weight / magnetic / tax / jackpot', () => {
    const pct = (x: number) => `${Math.round(x * 100)}%`
    expect(coinBlurb('weight')).toContain(pct(COIN_EFFECTS.weight.params.odds ?? 0))
    expect(coinBlurb('magnetic')).toContain(pct(COIN_EFFECTS.magnetic.params.odds ?? 0))
    expect(coinBlurb('tax')).toContain(`$${COIN_EFFECTS.tax.params.payout}`)
    expect(coinBlurb('jackpot')).toContain(`$${COIN_EFFECTS.jackpot.params.payout}`)
    expect(coinBlurb('jackpot')).toContain(pct(COIN_EFFECTS.jackpot.params.chance ?? 0))
  })
})
