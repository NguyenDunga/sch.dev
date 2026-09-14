// M5 — Pattern / Tier Matching: matchTier(play, boss) → highest of 6 tiers | none.
// M6 — Scoring Pipeline: scoreHand(play, boss, charms, rng) → Score.
// Checkpoints 5.1–5.12 (plan_wbs-m5-tier-matching.md), 6.1–6.10 (plan_wbs-m6-scoring.md).

import { describe, expect, it } from 'vitest'
import { matchTier, scoreHand } from './scoring'
import { filledSlot, none, some } from './helpers'
import { createRng } from './rng'
import type { Rng } from './rng'
import { JACKPOT_PAYOUT, TAX_PAYOUT, TIERS } from './balance'
import type { BossRuleId, CoinEffect, Face, Option, Play, TierId } from './types'

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
const freshRng = (): Rng => createRng('m6-test')

/** A play of effect coins: [face, effects] pairs, padded with empty slots. */
function effectPlay(entries: Array<[Face, CoinEffect[]]>): Play {
  let id = 0
  const slots: Play = entries.map(([face, effects]) => filledSlot({ id: id++, effects }, face))
  while (slots.length < 5) slots.push({ kind: 'empty' })
  return slots
}

/** Deterministic rng: next() returns the given values in order (cycling). */
const fakeRng = (values: number[]): Rng => {
  let i = 0
  return { next: () => values[i++ % values.length], state: () => [0, 0, 0, 0], restore: () => {} }
}

/** The tier's base value (chips × mult) from the table. */
const tierValue = (id: TierId): number => {
  const t = TIERS.find((x) => x.id === id)!
  return t.chips * t.mult
}

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

describe('M6.1 — tier step via matchTier', () => {
  it('a scored hand carries the matched tier', () => {
    expect(scoreHand(play('HHTH'), noBoss, [], freshRng())).toEqual({
      kind: 'scored',
      tier: 'threeSame',
      chips: 15,
      mult: 1,
      total: 15,
      cash: 0,
    })
  })

  it('boss tier rules apply through matchTier (noJackpots demotes 5-same to fourSame)', () => {
    const s = scoreHand(play('HHHHH'), boss('noJackpots'), [], freshRng())
    expect(s.kind === 'scored' && s.tier).toBe('fourSame')
  })
})

describe('M6.2 — base step from TIERS (null tier → 0/0)', () => {
  it('no tier → none, no chips/mult/total', () => {
    expect(scoreHand(play('HT'), noBoss, [], freshRng())).toEqual({ kind: 'none', cash: 0 })
  })

  it('base chips/mult come from the tier table', () => {
    const t = TIERS.find((x) => x.id === 'fourRow')!
    const s = scoreHand(play('HHHH'), noBoss, [], freshRng())
    expect(s.kind).toBe('scored')
    if (s.kind === 'scored') {
      expect(s.chips).toBe(t.chips)
      expect(s.mult).toBe(t.mult)
    }
  })
})

describe('M6.3 — boosters left→right, only the three scoring boosters', () => {
  it('plusChips adds 10 chips', () => {
    const s = scoreHand(play('HHTH'), noBoss, ['plusChips'], freshRng())
    expect(s.kind === 'scored' && s.chips).toBe(25)
  })

  it('plusMult adds 1 mult', () => {
    const s = scoreHand(play('HHTH'), noBoss, ['plusMult'], freshRng())
    expect(s.kind === 'scored' && s.mult).toBe(2)
  })

  it('jackpotFever doubles chips only on the jackpot tier', () => {
    const fever = (s: string) => {
      const score = scoreHand(play(s), noBoss, ['jackpotFever'], freshRng())
      return score.kind === 'scored' ? score.chips : -1
    }
    expect(fever('HHHHH')).toBe(100) // jackpot: 50 × 2
    expect(fever('HHHH')).toBe(40) // fourRow: untouched
  })

  it('non-scoring charms (extraHand, payday) are ignored', () => {
    const withCharms = scoreHand(play('HHTH'), noBoss, ['extraHand', 'payday'], freshRng())
    const without = scoreHand(play('HHTH'), noBoss, [], freshRng())
    expect(withCharms).toEqual(without)
  })
})

describe('M6.4 — total = chips × mult (boosters applied before multiplying)', () => {
  it('threeSame 15×1 + plusChips + plusMult → (15+10) × (1+1) = 50', () => {
    const s = scoreHand(play('HHTH'), noBoss, ['plusChips', 'plusMult'], freshRng())
    expect(s.kind === 'scored' && s.total).toBe(50)
  })

  it('all three boosters on jackpot: (50+10)×2 chips, (4+1) mult → 600', () => {
    const s = scoreHand(play('HHHHH'), noBoss, ['plusChips', 'plusMult', 'jackpotFever'], freshRng())
    expect(s.kind).toBe('scored')
    if (s.kind === 'scored') {
      expect(s.chips).toBe(120)
      expect(s.mult).toBe(5)
      expect(s.total).toBe(600)
    }
  })
})

describe('M6.5 — coin cash: Tax deterministic, Jackpot via rng', () => {
  it('Tax pays $1 per tax coin in the play (deterministic)', () => {
    const p = effectPlay([
      ['H', [{ kind: 'tax' }]],
      ['H', [{ kind: 'tax' }]],
      ['T', []],
      ['H', [{ kind: 'tax' }]],
    ])
    const s = scoreHand(p, noBoss, [], freshRng())
    expect(s.kind === 'scored' && s.cash).toBe(TAX_PAYOUT * 3) // threeSame still scores
  })

  it('Jackpot pays $4 per coin that passes its 25% roll (rng-driven threshold)', () => {
    const p = effectPlay([
      ['H', [{ kind: 'jackpot' }]],
      ['T', [{ kind: 'jackpot' }]],
    ])
    expect(scoreHand(p, noBoss, [], fakeRng([0.24, 0.26])).cash).toBe(JACKPOT_PAYOUT) // 0.24 passes, 0.26 fails
    expect(scoreHand(p, noBoss, [], fakeRng([0.25])).cash).toBe(0) // 0.25 is not < 0.25
    expect(scoreHand(p, noBoss, [], fakeRng([0.0, 0.1])).cash).toBe(JACKPOT_PAYOUT * 2)
  })

  it('a merged coin carries both effects and pays both', () => {
    const p = effectPlay([['H', [{ kind: 'tax' }, { kind: 'jackpot' }]]])
    const s = scoreHand(p, noBoss, [], fakeRng([0.1]))
    expect(s).toEqual({ kind: 'none', cash: TAX_PAYOUT + JACKPOT_PAYOUT })
  })
})

describe('M6.6 — charm order matters (left→right)', () => {
  it('[plusChips, jackpotFever] → (50+10)×2 chips vs [jackpotFever, plusChips] → 50×2+10 — totals differ', () => {
    const a = scoreHand(play('HHHHH'), noBoss, ['plusChips', 'jackpotFever'], freshRng())
    const b = scoreHand(play('HHHHH'), noBoss, ['jackpotFever', 'plusChips'], freshRng())
    expect(a.kind === 'scored' && a.total).toBe(480) // (50+10)*2 * 4
    expect(b.kind === 'scored' && b.total).toBe(440) // (50*2+10) * 4
  })
})

describe('M6.7 — no charms → total = baseChips × baseMult', () => {
  it('every tier at base values from TIERS', () => {
    const cases: Array<[string, TierId]> = [
      ['HHTH', 'threeSame'],
      ['HHH', 'tripleRun'],
      ['HHHTH', 'fourSame'],
      ['HHHH', 'fourRow'],
      ['HHHHH', 'jackpot'],
      ['HTHTH', 'alternating'],
    ]
    for (const [s, tier] of cases) {
      const score = scoreHand(play(s), noBoss, [], freshRng())
      expect(score.kind).toBe('scored')
      if (score.kind === 'scored') {
        expect(score.tier).toBe(tier)
        expect(score.total).toBe(tierValue(tier))
      }
    }
  })
})

describe('M6.8 — Tax cash calls no rng', () => {
  it('a Tax-only hand consumes zero rng draws', () => {
    let calls = 0
    const counting: Rng = {
      next: () => {
        calls++
        return 0.5
      },
      state: () => [0, 0, 0, 0],
      restore: () => {},
    }
    const p = effectPlay([
      ['H', [{ kind: 'tax' }]],
      ['H', [{ kind: 'tax' }]],
      ['T', []],
      ['H', [{ kind: 'tax' }]],
    ])
    const s = scoreHand(p, noBoss, [], counting)
    expect(s.kind === 'scored' && s.cash).toBe(TAX_PAYOUT * 3)
    expect(calls).toBe(0)
  })
})

describe('M6.9 — same seed → identical Jackpot cash (reproducible)', () => {
  const jackpotFive = () =>
    effectPlay([
      ['H', [{ kind: 'jackpot' }]],
      ['H', [{ kind: 'jackpot' }]],
      ['H', [{ kind: 'jackpot' }]],
      ['T', [{ kind: 'jackpot' }]],
      ['H', [{ kind: 'jackpot' }]],
    ])

  it('the same seed scores the same cash twice', () => {
    const cash = (seed: string) => {
      const s = scoreHand(jackpotFive(), noBoss, [], createRng(seed))
      return s.kind === 'scored' ? s.cash : -1
    }
    expect(cash('m6-9')).toBe(cash('m6-9'))
  })

  it('over 20 seeds the 25% roll produces both paying and non-paying hands', () => {
    const cashes = Array.from({ length: 20 }, (_, i) => {
      const s = scoreHand(jackpotFive(), noBoss, [], createRng(`m6-9-${i}`))
      return s.kind === 'scored' ? s.cash : -1
    })
    expect(cashes.some((c) => c > 0)).toBe(true)
    expect(cashes.some((c) => c === 0)).toBe(true)
  })
})

describe('M6.10 — null tier: total 0, no tier cash, but per-coin cash still pays', () => {
  it('a 2-coin play with Tax + Jackpot coins scores nothing but pays coin cash', () => {
    const p = effectPlay([
      ['H', [{ kind: 'tax' }]],
      ['T', [{ kind: 'jackpot' }]],
    ])
    expect(scoreHand(p, noBoss, [], fakeRng([0.1]))).toEqual({
      kind: 'none',
      cash: TAX_PAYOUT + JACKPOT_PAYOUT,
    })
    expect(scoreHand(p, noBoss, [], fakeRng([0.9]))).toEqual({ kind: 'none', cash: TAX_PAYOUT })
  })
})

describe('balance baseline — exhaustive 32-hand EV (plan_balance-baseline.md, corrected 2026-09-12)', () => {
  it('EV per hand = 1870/32, computed from TIERS over all 32 five-coin patterns', () => {
    // Baseline distribution: jackpot 2, fourRow 4, alternating 2, fourSame 6, tripleRun 6, threeSame 12.
    const expected =
      (2 * tierValue('jackpot') +
        4 * tierValue('fourRow') +
        2 * tierValue('alternating') +
        6 * tierValue('fourSame') +
        6 * tierValue('tripleRun') +
        12 * tierValue('threeSame')) /
      32
    let total = 0
    for (let m = 0; m < 32; m++) {
      const s = Array.from({ length: 5 }, (_, i) => (((m >> (4 - i)) & 1) ? 'H' : 'T') as Face).join('')
      const score = scoreHand(play(s), noBoss, [], freshRng())
      total += score.kind === 'scored' ? score.total : 0
    }
    expect(expected).toBe(58.4375) // pins the baseline number
    expect(total / 32).toBe(expected)
  })
})
