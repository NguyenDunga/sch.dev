// 13.3 — scoring choreography: pure logic (the 7-beat pacing + the visual
// snapshot helpers). No DOM, no store: the beat machine (the hook) and the
// overlay are integration-tested in run.juice.test.tsx.

import { describe, expect, it } from 'vitest'
import type { CharmId, Coin, Face, Play, Score, TierId } from '@/core/types'
import { none, some } from '@/core/helpers'
import {
  bannerText,
  beatDurations,
  BEAT_BUDGET_MS,
  cashCoinCount,
  chipCount,
  isBigHit,
  matchedIndices,
  takeSnapshot,
  TIER_RANK,
  type SnapshotCoin,
} from './choreo/choreography'

/** A plain coin (no effects) with the given id. */
const coin = (id: number): Coin => ({ id, effects: [] })

/** A filled play slot. */
const slot = (id: number, face: Face) => ({ kind: 'filled' as const, coin: coin(id), face, echoUsed: false })

/** A play of the given faces (empty slots count as nothing). */
const play = (faces: (Face | null)[]): Play =>
  faces.map((f, i) => (f === null ? { kind: 'empty' as const } : slot(i, f)))

/** A scored Score with the given tier numbers (cash 0). */
const scored = (tier: TierId, chips: number, mult: number): Score => ({
  kind: 'scored',
  tier,
  chips,
  mult,
  total: chips * mult,
  cash: 0,
})

/** A snapshot coin (a coin + its resolved face). */
const snap = (id: number, face: Face): SnapshotCoin => ({ coin: coin(id), face })

describe('takeSnapshot', () => {
  it('captures the filled play slots in order + the owned charms', () => {
    const p = play(['H', 'T', null, 'H', 'T'])
    const s = takeSnapshot(p, ['plusChips', 'payday'])
    expect(s.coins).toEqual([
      { coin: coin(0), face: 'H' },
      { coin: coin(1), face: 'T' },
      { coin: coin(3), face: 'H' },
      { coin: coin(4), face: 'T' },
    ])
    expect(s.charms).toEqual(['plusChips', 'payday'])
  })

  it('copies the charms (a later mutation never leaks into the snapshot)', () => {
    const charms: CharmId[] = ['plusChips']
    const s = takeSnapshot(play(['H']), charms)
    charms.push('payday')
    expect(s.charms).toEqual(['plusChips'])
  })
})

describe('matchedIndices', () => {
  it('no tier → no matched coins', () => {
    expect(matchedIndices([snap(0, 'H'), snap(1, 'T')], none)).toEqual([])
  })

  it('jackpot / alternating → every coin', () => {
    expect(matchedIndices([snap(0, 'H'), snap(1, 'H'), snap(2, 'H'), snap(3, 'H'), snap(4, 'H')], some('jackpot'))).toEqual(
      [0, 1, 2, 3, 4],
    )
    expect(matchedIndices([snap(0, 'H'), snap(1, 'T'), snap(2, 'H'), snap(3, 'T'), snap(4, 'H')], some('alternating'))).toEqual(
      [0, 1, 2, 3, 4],
    )
  })

  it('fourRow / tripleRun → the longest run of the face', () => {
    expect(matchedIndices([snap(0, 'H'), snap(1, 'H'), snap(2, 'H'), snap(3, 'H'), snap(4, 'T')], some('fourRow'))).toEqual(
      [0, 1, 2, 3],
    )
    // The run need not start at 0: THHH → [1, 2, 3].
    expect(matchedIndices([snap(0, 'T'), snap(1, 'H'), snap(2, 'H'), snap(3, 'H')], some('tripleRun'))).toEqual([1, 2, 3])
  })

  it('threeSame / fourSame → the first N of the majority face', () => {
    // HHTH → three H's (indices 0, 1, 3).
    expect(matchedIndices([snap(0, 'H'), snap(1, 'H'), snap(2, 'T'), snap(3, 'H')], some('threeSame'))).toEqual([0, 1, 3])
    // HHHTH → four H's.
    expect(matchedIndices([snap(0, 'H'), snap(1, 'H'), snap(2, 'H'), snap(3, 'T'), snap(4, 'H')], some('fourSame'))).toEqual(
      [0, 1, 2, 4],
    )
    // T majority: TTHH → the first three T's.
    expect(matchedIndices([snap(0, 'T'), snap(1, 'T'), snap(2, 'H'), snap(3, 'H'), snap(4, 'T')], some('threeSame'))).toEqual(
      [0, 1, 4],
    )
  })
})

describe('bannerText', () => {
  it('no tier → "No match"; jackpot → "JACKPOT!"; the rest → the tier name', () => {
    expect(bannerText({ kind: 'none', cash: 0 })).toBe('No match')
    expect(bannerText(scored('jackpot', 50, 4))).toBe('JACKPOT!')
    expect(bannerText(scored('fourRow', 40, 3))).toBe('4-IN-A-ROW')
    expect(bannerText(scored('threeSame', 15, 1))).toBe('3-SAME')
  })
})

describe('TIER_RANK / isBigHit', () => {
  it('ranks the tiers high → low (jackpot 5 … threeSame 0)', () => {
    expect(TIER_RANK.jackpot).toBe(5)
    expect(TIER_RANK.fourRow).toBe(4)
    expect(TIER_RANK.alternating).toBe(3)
    expect(TIER_RANK.fourSame).toBe(2)
    expect(TIER_RANK.tripleRun).toBe(1)
    expect(TIER_RANK.threeSame).toBe(0)
  })

  it('a big hit is rank ≥ 3 (alternating, fourRow, jackpot)', () => {
    expect(isBigHit('jackpot')).toBe(true)
    expect(isBigHit('fourRow')).toBe(true)
    expect(isBigHit('alternating')).toBe(true)
    expect(isBigHit('fourSame')).toBe(false)
    expect(isBigHit('tripleRun')).toBe(false)
    expect(isBigHit('threeSame')).toBe(false)
  })
})

describe('beatDurations', () => {
  it('reduced motion → the fast beats (≤150ms, UX §8)', () => {
    const d = beatDurations(scored('jackpot', 50, 4), 5, 0, true)
    expect(d).toEqual({ reveal: 150, banner: 150, chips: 150, mult: 100, resolve: 150, cash: 150, settle: 100 })
    expect(Object.values(d).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(BEAT_BUDGET_MS)
  })

  it('no tier → the chips/mult/resolve beats are zero (only banner + settle)', () => {
    const d = beatDurations({ kind: 'none', cash: 0 }, 2, 0, false)
    expect(d.chips).toBe(0)
    expect(d.mult).toBe(0)
    expect(d.resolve).toBe(0)
    expect(d.cash).toBe(0)
  })

  it('the budget scales with score size and is capped at ~2.4s', () => {
    const sum = (d: ReturnType<typeof beatDurations>) =>
      d.reveal + d.banner + d.chips + d.mult + d.resolve + d.cash + d.settle
    const small = beatDurations(scored('threeSame', 15, 1), 3, 0, false)
    expect(sum(small)).toBeLessThan(BEAT_BUDGET_MS)
    // A big jackpot with lots of cash coins wants more than the budget →
    // every beat is scaled down so the sum lands on the cap.
    const big = beatDurations(scored('jackpot', 600, 10), 5, 5, false)
    expect(sum(big)).toBeLessThanOrEqual(BEAT_BUDGET_MS)
    expect(sum(big)).toBeGreaterThan(BEAT_BUDGET_MS - 10) // scaled, not truncated
  })

  it('the cash beat grows with the cash coins (capped at 5)', () => {
    const base = beatDurations({ kind: 'none', cash: 5 }, 1, 1, false)
    expect(base.cash).toBe(250 + 80)
    expect(beatDurations({ kind: 'none', cash: 5 }, 1, 3, false).cash).toBe(250 + 3 * 80)
    expect(beatDurations({ kind: 'none', cash: 5 }, 1, 9, false).cash).toBe(250 + 5 * 80)
  })
})

describe('cashCoinCount', () => {
  it('counts the Tax/Jackpot coins (a merged coin once)', () => {
    const tax = { id: 1, effects: [{ kind: 'tax' as const }] }
    const jackpot = { id: 2, effects: [{ kind: 'jackpot' as const }] }
    const merged = { id: 3, effects: [{ kind: 'tax' as const }, { kind: 'jackpot' as const }] }
    const plain = { id: 4, effects: [] }
    const coins = [
      { coin: tax, face: 'H' as const },
      { coin: jackpot, face: 'T' as const },
      { coin: merged, face: 'H' as const },
      { coin: plain, face: 'T' as const },
    ]
    expect(cashCoinCount(coins)).toBe(3)
    expect(cashCoinCount([])).toBe(0)
  })
})

describe('chipCount', () => {
  it('one chip per contributing coin + scoring charm, capped at 12', () => {
    // 5 matched + 3 scoring charms = 8.
    expect(chipCount(scored('jackpot', 50, 4), [0, 1, 2, 3, 4], ['plusChips', 'plusMult', 'extraHand'])).toBe(7)
    // extraHand is not a scoring charm (only plusChips/plusMult/jackpotFever).
    expect(chipCount(scored('threeSame', 15, 1), [0, 1, 2], ['extraHand', 'payday'])).toBe(3)
    // 12 matched + 5 charms → capped at 12.
    expect(chipCount(scored('jackpot', 50, 4), Array.from({ length: 12 }, (_, i) => i), ['plusChips', 'plusMult'])).toBe(
      12,
    )
  })

  it('jackpotFever contributes only on a jackpot', () => {
    expect(chipCount(scored('jackpot', 50, 4), [0, 1, 2], ['jackpotFever'])).toBe(4)
    expect(chipCount(scored('threeSame', 15, 1), [0, 1, 2], ['jackpotFever'])).toBe(3)
  })

  it('no tier → no chips', () => {
    expect(chipCount({ kind: 'none', cash: 0 }, [0, 1], ['plusChips'])).toBe(0)
  })
})
