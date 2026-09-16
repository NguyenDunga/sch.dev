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
import type { CharmId, Face, Play, Score, TierId } from './types'

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
const noCharms: CharmId[] = []
const freshRng = () => createRng('m14-boundary')

const tierValue = (id: TierId): number => {
  const t = TIERS.find((x) => x.id === id)!
  return t.chips * t.mult
}

/** Assert the score is 'scored' and return its total. */
function scoredTotal(score: Score): number {
  expect(score.kind).toBe('scored')
  return (score as { kind: 'scored'; total: number }).total
}

/** Assert the score is 'none'. */
function assertNone(score: Score): void {
  expect(score.kind).toBe('none')
}

/** The expected tier for a play of N coins with a given face pattern. */
describe('M14.4 — Boundary sweep: coin count × tier', () => {
  // ── 1 coin ──────────────────────────────────────────────────────────
  describe('1 tossed coin', () => {
    it('no tier possible (n < 3)', () => {
      expect(matchTier(play('H'), noBoss)).toEqual(none)
      assertNone(scoreHand(play('H'), noBoss, noCharms, freshRng()))
    })
  })

  // ── 2 coins ─────────────────────────────────────────────────────────
  describe('2 tossed coins', () => {
    it('HH → no tier (n < 3)', () => {
      expect(matchTier(play('HH'), noBoss)).toEqual(none)
      assertNone(scoreHand(play('HH'), noBoss, noCharms, freshRng()))
    })

    it('HT → no tier (n < 3)', () => {
      expect(matchTier(play('HT'), noBoss)).toEqual(none)
      assertNone(scoreHand(play('HT'), noBoss, noCharms, freshRng()))
    })
  })

  // ── 3 coins ─────────────────────────────────────────────────────────
  describe('3 tossed coins', () => {
    it('HHH → tripleRun (run of 3)', () => {
      expect(matchTier(play('HHH'), noBoss)).toEqual(some('tripleRun'))
      expect(scoredTotal(scoreHand(play('HHH'), noBoss, noCharms, freshRng()))).toBe(tierValue('tripleRun'))
    })

    it('HHT → no tier (H=2, T=1, maxCount=2, maxRun=2)', () => {
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
      expect(scoredTotal(scoreHand(play('HHHH'), noBoss, noCharms, freshRng()))).toBe(tierValue('fourRow'))
    })

    it('HHHT → tripleRun (run of 3 Hs, maxCount=3)', () => {
      expect(matchTier(play('HHHT'), noBoss)).toEqual(some('tripleRun'))
      expect(scoredTotal(scoreHand(play('HHHT'), noBoss, noCharms, freshRng()))).toBe(tierValue('tripleRun'))
    })

    it('HHTH → threeSame (H=3, maxRun=2)', () => {
      expect(matchTier(play('HHTH'), noBoss)).toEqual(some('threeSame'))
      expect(scoredTotal(scoreHand(play('HHTH'), noBoss, noCharms, freshRng()))).toBe(tierValue('threeSame'))
    })

    it('HTHH → threeSame (H=3, maxRun=2)', () => {
      expect(matchTier(play('HTHH'), noBoss)).toEqual(some('threeSame'))
    })
  })

  // ── 5 coins ─────────────────────────────────────────────────────────
  describe('5 tossed coins', () => {
    it('HHHHH → jackpot', () => {
      expect(matchTier(play('HHHHH'), noBoss)).toEqual(some('jackpot'))
      expect(scoredTotal(scoreHand(play('HHHHH'), noBoss, noCharms, freshRng()))).toBe(tierValue('jackpot'))
    })

    it('HHHHT → fourRow (run of 4 Hs)', () => {
      expect(matchTier(play('HHHHT'), noBoss)).toEqual(some('fourRow'))
      expect(scoredTotal(scoreHand(play('HHHHT'), noBoss, noCharms, freshRng()))).toBe(tierValue('fourRow'))
    })

    it('HTHTH → alternating', () => {
      expect(matchTier(play('HTHTH'), noBoss)).toEqual(some('alternating'))
      expect(scoredTotal(scoreHand(play('HTHTH'), noBoss, noCharms, freshRng()))).toBe(tierValue('alternating'))
    })

    it('HHHTH → fourSame (H=4, maxRun=3)', () => {
      expect(matchTier(play('HHHTH'), noBoss)).toEqual(some('fourSame'))
      expect(scoredTotal(scoreHand(play('HHHTH'), noBoss, noCharms, freshRng()))).toBe(tierValue('fourSame'))
    })

    it('HHHTT → tripleRun (run of 3 Hs)', () => {
      expect(matchTier(play('HHHTT'), noBoss)).toEqual(some('tripleRun'))
      expect(scoredTotal(scoreHand(play('HHHTT'), noBoss, noCharms, freshRng()))).toBe(tierValue('tripleRun'))
    })

    it('HHTTH → threeSame (H=3)', () => {
      expect(matchTier(play('HHTTH'), noBoss)).toEqual(some('threeSame'))
      expect(scoredTotal(scoreHand(play('HHTTH'), noBoss, noCharms, freshRng()))).toBe(tierValue('threeSame'))
    })

    it('HTHTT → threeSame (T=3)', () => {
      expect(matchTier(play('HTHTT'), noBoss)).toEqual(some('threeSame'))
    })
  })

  // ── Full pipeline: scoreHand with charms ────────────────────────────
  describe('scoreHand pipeline with charms', () => {
    it('plusChips boosts chips: tripleRun + plusChips', () => {
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      const boosted = (tier.chips + 10) * tier.mult
      expect(scoredTotal(scoreHand(play('HHH'), noBoss, ['plusChips'], freshRng()))).toBe(boosted)
      expect(boosted).toBeGreaterThan(tierValue('tripleRun'))
    })

    it('plusMult boosts mult: tripleRun + plusMult', () => {
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      const boosted = tier.chips * (tier.mult + 1)
      expect(scoredTotal(scoreHand(play('HHH'), noBoss, ['plusMult'], freshRng()))).toBe(boosted)
    })

    it('jackpotFever doubles chips on jackpot only', () => {
      const tier = TIERS.find((t) => t.id === 'jackpot')!
      const boosted = tier.chips * 2 * tier.mult
      expect(scoredTotal(scoreHand(play('HHHHH'), noBoss, ['jackpotFever'], freshRng()))).toBe(boosted)
    })

    it('jackpotFever does NOT boost non-jackpot tiers', () => {
      const tier = TIERS.find((t) => t.id === 'tripleRun')!
      expect(scoredTotal(scoreHand(play('HHH'), noBoss, ['jackpotFever'], freshRng()))).toBe(tier.chips * tier.mult)
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
