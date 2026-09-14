// M5 — Pattern / Tier Matching: matchTier(play, boss) → highest of 6 tiers | none.
// Checkpoints 5.1–5.12 (plan_wbs-m5-tier-matching.md).

import { describe, expect, it } from 'vitest'
import { matchTier } from './scoring'
import { filledSlot, none, some } from './helpers'
import type { BossRuleId, Face, Option, Play } from './types'

/** Build a 5-slot play from a string: 'H'/'T' = tossed coin, '.' = empty slot. */
function play(s: string): Play {
  const slots = s.split('')
  while (slots.length < 5) slots.push('.')
  let id = 0
  return slots.map((ch) =>
    ch === '.' ? { kind: 'empty' as const } : filledSlot({ id: id++, effects: [] }, ch as Face),
  )
}

const noBoss: Option<BossRuleId> = none
const boss = (id: BossRuleId): Option<BossRuleId> => some(id)

describe('M5.1 — faces read from non-null slots only', () => {
  it('empty slots count as nothing: HHT.H is a 4-face 3-same', () => {
    expect(matchTier(play('HHT.H'), noBoss)).toEqual(some('threeSame'))
  })

  it('empty slots do not break runs: H.H.H reads as HHH → tripleRun', () => {
    expect(matchTier(play('H.H.H'), noBoss)).toEqual(some('tripleRun'))
  })

  it('a 5-slot play with an empty slot cannot be a jackpot', () => {
    expect(matchTier(play('HHHH.'), noBoss)).toEqual(some('fourRow'))
  })
})

describe('M5.2–5.7 — each tier at its minimum coin count', () => {
  // Note: at a tier's structural minimum, a higher-priority tier may shadow it
  // (HHH is a tripleRun, HHHH is a fourRow), so threeSame/fourSame are proven
  // at the smallest count where they can actually win (4 and 5).
  it('5.2 threeSame: a face appears exactly 3 times, no run of 3 (HHTH)', () => {
    expect(matchTier(play('HHTH'), noBoss)).toEqual(some('threeSame'))
  })

  it('5.3 fourSame: a face appears ≥4 times, not adjacent (HHHTH)', () => {
    expect(matchTier(play('HHHTH'), noBoss)).toEqual(some('fourSame'))
  })

  it('5.4 jackpot: 5 coins, all identical (HHHHH)', () => {
    expect(matchTier(play('HHHHH'), noBoss)).toEqual(some('jackpot'))
  })

  it('5.5 fourRow: 4 coins, a run of 4 adjacent equal (HHHH)', () => {
    expect(matchTier(play('HHHH'), noBoss)).toEqual(some('fourRow'))
  })

  it('5.6 alternating: 5 coins, strictly alternating (HTHTH)', () => {
    expect(matchTier(play('HTHTH'), noBoss)).toEqual(some('alternating'))
  })

  it('5.7 tripleRun: 3 coins, a run of 3 adjacent equal (HHH)', () => {
    expect(matchTier(play('HHH'), noBoss)).toEqual(some('tripleRun'))
  })
})

describe('M5.8 — priority: highest match wins', () => {
  it('HHHHH → jackpot, never fourRow/fourSame/tripleRun', () => {
    expect(matchTier(play('HHHHH'), noBoss)).toEqual(some('jackpot'))
  })

  it('HHHHT → fourRow over fourSame (both match)', () => {
    expect(matchTier(play('HHHHT'), noBoss)).toEqual(some('fourRow'))
  })

  it('HTHTH → alternating over threeSame (H appears 3×)', () => {
    expect(matchTier(play('HTHTH'), noBoss)).toEqual(some('alternating'))
  })

  it('HHHTH → fourSame over tripleRun (both match)', () => {
    expect(matchTier(play('HHHTH'), noBoss)).toEqual(some('fourSame'))
  })

  it('HHTT → no tier (no run of 3, no face 3×)', () => {
    expect(matchTier(play('HHTT'), noBoss)).toEqual(none)
  })
})

describe('M5.9 — ≤2 non-null slots → none', () => {
  it('0, 1 and 2 coins never match a tier', () => {
    expect(matchTier(play('.....'), noBoss)).toEqual(none)
    expect(matchTier(play('H....'), noBoss)).toEqual(none)
    expect(matchTier(play('HH...'), noBoss)).toEqual(none)
    expect(matchTier(play('HT...'), noBoss)).toEqual(none)
    expect(matchTier(play('H.T..'), noBoss)).toEqual(none)
  })
})

describe('M5.10 — tier-affecting boss rules', () => {
  it('noAlternating: alternating play → none (explicit override, no fall-through to threeSame)', () => {
    expect(matchTier(play('HTHTH'), boss('noAlternating'))).toEqual(none)
  })

  it('noAlternating: non-alternating plays unaffected (HHHHH still jackpot)', () => {
    expect(matchTier(play('HHHHH'), boss('noAlternating'))).toEqual(some('jackpot'))
  })

  it('noJackpots: 5-same → fourSame (fixed demotion, not a fall-through to fourRow)', () => {
    expect(matchTier(play('HHHHH'), boss('noJackpots'))).toEqual(some('fourSame'))
  })

  it('noJackpots: 4-run still fourRow (HHHHT)', () => {
    expect(matchTier(play('HHHHT'), boss('noJackpots'))).toEqual(some('fourRow'))
  })

  it('other boss rules do not affect tiers (shortFuse, heavyTarget)', () => {
    expect(matchTier(play('HTHTH'), boss('shortFuse'))).toEqual(some('alternating'))
    expect(matchTier(play('HHHHH'), boss('heavyTarget'))).toEqual(some('jackpot'))
  })
})

describe('M5.11/5.12 — min-coin matrix and 2-coin plays', () => {
  it('every tier is reachable at the smallest coin count where it can win', () => {
    const tier = (s: string) => matchTier(play(s), noBoss)
    expect(tier('HHH')).toEqual(some('tripleRun')) // min 3
    expect(tier('HHTH')).toEqual(some('threeSame')) // min 4 (3 is shadowed by tripleRun)
    expect(tier('HHHH')).toEqual(some('fourRow')) // min 4
    expect(tier('HHHTH')).toEqual(some('fourSame')) // min 5 (4 is shadowed by fourRow)
    expect(tier('HHHHH')).toEqual(some('jackpot')) // min 5
    expect(tier('HTHTH')).toEqual(some('alternating')) // min 5
  })

  it('tiers cannot match below their structural minimum (k-coin plays fit only k-sized patterns)', () => {
    const tier = (s: string) => matchTier(play(s), noBoss)
    expect(tier('HHT')).toEqual(none) // 3 coins: threeSame needs a face 3× — HHT has only 2 H
    expect(tier('HHTT')).toEqual(none) // 4 coins: fourSame needs a face 4× — HHTT has only 2 H
  })

  it('any 2-coin play → none', () => {
    for (const s of ['HH', 'HT', 'TH', 'TT']) {
      expect(matchTier(play(s), noBoss)).toEqual(none)
    }
  })
})
