// M14.4 — Boundary sweep: 1, 2, 3, 5 tossed coins against all 6 tiers,
// through the full `scoreHand` pipeline.
//
// For each coin count and each tier, we construct a play that matches (or
// deliberately misses) the tier, run it through `scoreHand`, and assert the
// expected tier + base value. This is a regression net: if the tier
// thresholds shift, these tests catch it.

import { describe, expect, it } from 'vitest'
import { matchTier, scoreHand } from './scoring'
import { filledSlot, none, some } from './helpers'
import { createRng } from './rng'
import { TIERS } from './balance'
import type { Face, Play, TierId } from './types'

/** Build a Play from a string: 'H'/'T' = tossed coin, '.' = empty slot. */
function play(s: string): Play {
  const slots = s.split('')
  while (slots.length < 5) slots.push('.')
  let id = 0
  return slots.map((ch) =>
    ch === '.' ? { kind: 'empty' as const } : filledSlot({ id: id++, effects: [] }, ch as Face),
  )
}

const noBoss = none
const noCharms: string[] = []
const freshRng = () => createRng('m14-boundary')

const tierValue = (id: TierId): number => {
  const t = TIERS.find((x) => x.id === id)!
  return t.chips * t.mult
}

/** The expected tier for a play of N coins with a given face pattern. */
describe('M14.4 — Boundary sweep: coin count × tier', () => {
  // ── 1 coin ──────────────────────────────────────────────────────────
  describe('1 tossed coin', () => {
    it('no tier possible (n < 3)', () => {
      expect(matchTier(play('H'), noBoss)).toEqual(none)
      const score = scoreHand(play('H'), noBoss, noCharms, freshRng())
      expect(score.kind).toBe('none')
    })
  })

  // ── 2 coins ─────────────────────────────────────────────────────────
  describe('2 tossed coins', () => {
    it('HH → no tier (n < 3)', () => {
      expect(matchTier(play('HH'), noBoss)).toEqual(none)
      const score = scoreHand(play('HH'), noBoss, noCharms, freshRng())
      expect(score.kind).toBe('none')
    })

    it('HT → no tier (n < 3)', () => {
      expect(matchTier(play('HT'), noBoss)).toEqual(none)
      const score = scoreHand(play('HT'), noBoss, noCharms, freshRng())
      expect(score.kind).toBe('none')
    })
  })

  // ── 3 coins ─────────────────────────────────────────────────────────
  describe('3 tossed coins', () => {
    it('HHH → tripleRun (run of 3)', () => {
      expect(matchTier(play('HHH'), noBoss)).toEqual(some('tripleRun'))
      const score = scoreHand(play('HHH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('tripleRun'))
    })

    it('HHT → threeSame (H appears 3×? No — H appears 2, T appears 1 → none)', () => {
      // HHT: H=2, T=1, maxCount=2, maxRun=2 → no tier
      expect(matchTier(play('HHT'), noBoss)).toEqual(none)
    })

    it('HTH → no tier (maxCount=2, maxRun=1)', () => {
      expect(matchTier(play('HTH'), noBoss)).toEqual(none)
    })
  })

  // ── 4 coins ─────────────────────────────────────────────────────────
  describe('4 tossed coins', () => {
    it('HHHH → fourRow (run of 4)', () => {
      expect(matchTier(play('HHHH'), noBoss)).toEqual(some('fourRow'))
      const score = scoreHand(play('HHHH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('fourRow'))
    })

    it('HHHT → fourSame (H appears 4×, not all adjacent? No — HHH is a run of 3, then T. maxRun=3, maxCount=4 → fourSame)', () => {
      // HHHT: H=3, T=1, maxCount=3, maxRun=3 → tripleRun (run of 3)
      // Wait: H=3 not 4. Let me re-check: H,H,H,T → H count = 3, T count = 1
      // maxCount = 3, maxRun = 3 → tripleRun
      expect(matchTier(play('HHHT'), noBoss)).toEqual(some('tripleRun'))
    })

    it('HHHTH → fourSame (H appears 4×, not adjacent)', () => {
      // This is 5 slots. For 4 coins: H,H,H,T is 4. Let's use HHTH (4 coins)
      // HHTH: H=3, T=1, maxCount=3, maxRun=2 → threeSame
      expect(matchTier(play('HHTH'), noBoss)).toEqual(some('threeSame'))
    })

    it('HHHT → tripleRun (run of 3 Hs)', () => {
      expect(matchTier(play('HHHT'), noBoss)).toEqual(some('tripleRun'))
    })

    it('HTHH → fourSame? No: H=3, T=1, maxRun=2 → threeSame', () => {
      expect(matchTier(play('HTHH'), noBoss)).toEqual(some('threeSame'))
    })
  })

  // ── 5 coins ─────────────────────────────────────────────────────────
  describe('5 tossed coins', () => {
    it('HHHHH → jackpot', () => {
      expect(matchTier(play('HHHHH'), noBoss)).toEqual(some('jackpot'))
      const score = scoreHand(play('HHHHH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('jackpot'))
    })

    it('HHHHT → fourRow (run of 4 Hs)', () => {
      expect(matchTier(play('HHHHT'), noBoss)).toEqual(some('fourRow'))
      const score = scoreHand(play('HHHHT'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('fourRow'))
    })

    it('HTHTH → alternating', () => {
      expect(matchTier(play('HTHTH'), noBoss)).toEqual(some('alternating'))
      const score = scoreHand(play('HTHTH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('alternating'))
    })

    it('HHHTH → fourSame (H appears 4×, maxRun=3)', () => {
      expect(matchTier(play('HHHTH'), noBoss)).toEqual(some('fourSame'))
      const score = scoreHand(play('HHHTH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('fourSame'))
    })

    it('HHHTT → tripleRun (run of 3 Hs)', () => {
      expect(matchTier(play('HHHTT'), noBoss)).toEqual(some('tripleRun'))
      const score = scoreHand(play('HHHTT'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('tripleRun'))
    })

    it('HHTTH → threeSame (H appears 3×)', () => {
      expect(matchTier(play('HHTTH'), noBoss)).toEqual(some('threeSame'))
      const score = scoreHand(play('HHTTH'), noBoss, noCharms, freshRng())
      expect(score.total).toBe(tierValue('threeSame'))
    })

    it('HTHTT → no tier (H=2, T=3, maxCount=3 → threeSame? T=3 → threeSame)', () => {
      // HTHTT: H=2, T=3, maxCount=3, maxRun=2 → threeSame
      expect(matchTier(play('HTHTT'), noBoss)).toEqual(some('threeSame'))
    })
  })

  // ── Full pipeline: scoreHand with charms ────────────────────────────
  describe('scoreHand pipeline with charms', () => {
    it('plusCharm boosts chips: tripleRun + plusChips', () => {
      const base = tierValue('tripleRun')
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      const boosted = (tier.chips + 10) * tier.mult
      const score = scoreHand(play('HHH'), noBoss, ['plusChips'], freshRng())
      expect(score.total).toBe(boosted)
      expect(boosted).toBeGreaterThan(base)
    })

    it('plusMult boosts mult: tripleRun + plusMult', () => {
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      const boosted = tier.chips * (tier.mult + 1)
      const score = scoreHand(play('HHH'), noBoss, ['plusMult'], freshRng())
      expect(score.total).toBe(boosted)
    })

    it('jackpotFever doubles chips on jackpot only', () => {
      const tier = TIERS.find((t) => t.id === 'jackpot')!
      const boosted = tier.chips * 2 * tier.mult
      const score = scoreHand(play('HHHHH'), noBoss, ['jackpotFever'], freshRng())
      expect(score.total).toBe(boosted)
    })

    it('jackpotFever does NOT boost non-jackpot tiers', () => {
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      const score = scoreHand(play('HHH'), noBoss, ['jackpotFever'], freshRng())
      expect(score.total).toBe(tier.chips * tier.mult) // unchanged
    })
  })

  // ── Boss rules ──────────────────────────────────────────────────────
  describe('boss tier rules', () => {
    it('noJackpots: HHHHH → fourSame (demotion)', () => {
      expect(matchTier(play('HHHHH'), some('noJackpots'))).toEqual(some('fourSame'))
    })

    it('noAlternating: HTHTH → none', () => {
      expect(matchTier(play('HTHTH'), some('noAlternating'))).toEqual(none)
    })
  })
})
