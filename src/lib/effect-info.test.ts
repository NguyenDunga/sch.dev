// @vitest-environment node
// Effect info — the parameter-aware display names + blurbs (Weight's
// favoured face, Draw's count) + registry completeness (every kind has a
// name + blurb; every catalog id has a popover row).

import { describe, expect, it } from 'vitest'
import { catalogEntry, effectBlurb, effectDisplayName, effectEntries } from './effect-info'
import { COIN_EFFECTS, coinBlurb } from '@/config/coins'
import type { CoinEffectId, CoinEffectKind } from '@/core/types'

const ALL_KINDS: CoinEffectKind[] = [
  'weight', 'heads', 'tails', 'chaos', 'echo', 'magnetic', 'reverse', 'tax', 'jackpot', 'draw',
]
const ALL_CATALOG: CoinEffectId[] = [
  'weight', 'heads', 'tails', 'chaos', 'echo', 'magnetic', 'reverse', 'tax', 'jackpot', 'draw1', 'draw2', 'draw3',
]

describe('effectDisplayName', () => {
  it('weight names its favoured face; draw names its count; others use the config name', () => {
    const hi = Math.round((COIN_EFFECTS.weight.params.odds ?? 0.75) * 100)
    expect(effectDisplayName({ kind: 'weight', favored: 'H' })).toBe(`Weight (Heads ${hi}/${100 - hi})`)
    expect(effectDisplayName({ kind: 'weight', favored: 'T' })).toBe(`Weight (Tails ${hi}/${100 - hi})`)
    expect(effectDisplayName({ kind: 'draw', count: 2 })).toBe('Draw-2')
    expect(effectDisplayName({ kind: 'echo' })).toBe('Echo')
  })
})

describe('effectBlurb', () => {
  it('draw names its count; the others use the config blurb', () => {
    expect(effectBlurb({ kind: 'draw', count: 1 })).toBe('Discarding it redraws 1 coin face-down into empty hand slots')
    expect(effectBlurb({ kind: 'draw', count: 3 })).toBe('Discarding it redraws 3 coins face-down into empty hand slots')
    expect(effectBlurb({ kind: 'echo' })).toBe(coinBlurb('echo'))
    expect(effectBlurb({ kind: 'heads' })).toBe(coinBlurb('heads'))
  })
})

describe('effectEntries', () => {
  it('one row per effect, parameter-aware', () => {
    const entries = effectEntries([
      { kind: 'weight', favored: 'H' },
      { kind: 'draw', count: 2 },
    ])
    expect(entries).toEqual([
      { kind: 'weight', name: effectDisplayName({ kind: 'weight', favored: 'H' }), blurb: coinBlurb('weight') },
      { kind: 'draw', name: 'Draw-2', blurb: effectBlurb({ kind: 'draw', count: 2 }) },
    ])
  })
})

describe('catalogEntry', () => {
  it('covers every shop-catalog id (draw tiers → count; weight → generic)', () => {
    for (const id of ALL_CATALOG) {
      const entry = catalogEntry(id)
      expect(entry.name).toBeTruthy()
      expect(entry.blurb).toBeTruthy()
    }
    expect(catalogEntry('draw3').name).toBe('Draw-3')
    expect(catalogEntry('draw3').blurb).toBe(effectBlurb({ kind: 'draw', count: 3 }))
    expect(catalogEntry('weight').blurb).toBe(coinBlurb('weight'))
  })
})

describe('registry completeness', () => {
  it('every CoinEffectKind has a config name + blurb', () => {
    for (const kind of ALL_KINDS) {
      expect(COIN_EFFECTS[kind].name).toBeTruthy()
      expect(coinBlurb(kind)).toBeTruthy()
    }
  })
})
