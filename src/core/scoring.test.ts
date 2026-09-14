import { describe, expect, it } from 'vitest'
import { createRng, type Rng } from './rng'
import { detectTier, matchTier, resolveFace, scoreHand } from './scoring'
import { TIERS } from './balance'
import type { Coin, Face, Hand, TierId } from './types'

// All 32 possible full hands pinned to their scoring tier (highest-value-wins).
// Verified 2026-09-12 against the locked tier definitions + priority order.
const ALL_HANDS: Record<string, TierId> = {
  HHHHH: 'jackpot',
  TTTTT: 'jackpot',
  HHHHT: 'fourRow',
  THHHH: 'fourRow',
  HTTTT: 'fourRow',
  TTTTH: 'fourRow',
  HTHTH: 'alternating',
  THTHT: 'alternating',
  HTHHH: 'fourSame',
  HHHTH: 'fourSame',
  HHTHH: 'fourSame',
  THTTT: 'fourSame',
  TTHTT: 'fourSame',
  TTTHT: 'fourSame',
  HHHTT: 'tripleRun',
  THHHT: 'tripleRun',
  TTHHH: 'tripleRun',
  HHTTT: 'tripleRun',
  HTTTH: 'tripleRun',
  TTTHH: 'tripleRun',
  HHTHT: 'threeSame',
  HHTTH: 'threeSame',
  HTHHT: 'threeSame',
  THHTH: 'threeSame',
  THTTH: 'threeSame',
  TTHTH: 'threeSame',
  HTHTT: 'threeSame',
  THHTT: 'threeSame',
  HTTHT: 'threeSame',
  TTHHT: 'threeSame',
  HTTHH: 'threeSame',
  THTHH: 'threeSame',
}

/** 'H'/'T' = plain coin, '.' = empty slot (counts as nothing). */
const hh = (s: string): Hand =>
  s.split('').map((ch, i) =>
    ch === '.'
      ? null
      : { coin: { id: i, effects: [] as Coin['effects'] }, face: ch as Face, echoUsed: false },
  ) as Hand

const faces = (s: string): Face[] => s.split('') as Face[]

const coin = (effects: Coin['effects'], param?: Face): Coin => ({
  id: 0,
  effects,
  param,
})

/** Deterministic rng fed from a fixed value list. */
const fakeRng = (values: number[]): Rng => ({
  next: () => values.shift()!,
  state: () => [],
})

describe('detectTier (full 5-face hands)', () => {
  it('pins all 32 possible hands to their tier', () => {
    expect(Object.keys(ALL_HANDS)).toHaveLength(32)
    for (const [hand, tier] of Object.entries(ALL_HANDS)) {
      expect(detectTier(faces(hand)), hand).toBe(tier)
    }
  })

  it('highest-value-wins: overlapping hands score the top tier they match', () => {
    expect(detectTier(faces('HHHHH'))).toBe('jackpot')
    expect(detectTier(faces('HHHHT'))).toBe('fourRow')
    expect(detectTier(faces('HTHTH'))).toBe('alternating')
    expect(detectTier(faces('HTHHH'))).toBe('fourSame')
    expect(detectTier(faces('HHHTT'))).toBe('tripleRun')
  })
})

describe('detectTier (short hands — empty slots are nothing, Q&A round 4)', () => {
  it('a k-coin play only matches tiers that fit in k coins', () => {
    // 3 coins: only triple-run / 3-same can fit
    expect(detectTier(faces('HHH'))).toBe('tripleRun')
    expect(detectTier(faces('TTT'))).toBe('tripleRun')
    expect(detectTier(faces('HHT'))).toBeNull()
    expect(detectTier(faces('HTH'))).toBeNull()
    // 4 coins: 4-in-a-row / 4-same / triple-run / 3-same can fit
    expect(detectTier(faces('HHHH'))).toBe('fourRow')
    expect(detectTier(faces('HHHT'))).toBe('tripleRun')
    expect(detectTier(faces('HHTH'))).toBe('threeSame')
    expect(detectTier(faces('HTHT'))).toBeNull()
    // alternating needs exactly 5 coins — HTH is not alternating
    expect(detectTier(faces('HTH'))).toBeNull()
  })

  it('plays of ≤2 coins match no tier', () => {
    expect(detectTier(faces('HH'))).toBeNull()
    expect(detectTier(faces('H'))).toBeNull()
    expect(detectTier(faces(''))).toBeNull()
  })
})

describe('matchTier (empty slots = nothing, Q&A round 4)', () => {
  it('matches the same tier as detectTier for full hands', () => {
    for (const [hand, tier] of Object.entries(ALL_HANDS)) {
      expect(matchTier(hh(hand)), hand).toBe(tier)
    }
  })

  it('empty slots count as nothing — the pattern is the tossed coins only', () => {
    // HHH + 2 empty → Triple-run (40), NOT Jackpot
    expect(matchTier(hh('HHH..'))).toBe('tripleRun')
    // 1 coin + 4 empty → no tier (was Jackpot with wilds)
    expect(matchTier(hh('H....'))).toBeNull()
    // HT + 3 empty → no tier (was 4-in-a-row with wilds)
    expect(matchTier(hh('HT...'))).toBeNull()
    // HTH + 2 empty → no tier (alternating needs exactly 5)
    expect(matchTier(hh('HTH..'))).toBeNull()
    // 4 coins + 1 empty: HHHH → 4-in-a-row, HHHT → Triple-run
    expect(matchTier(hh('HHHH.'))).toBe('fourRow')
    expect(matchTier(hh('HHHT.'))).toBe('tripleRun')
  })

  it('scattered coins compress left-to-right: H.T.H → HTH (no tier), H.H.H → HHH (Triple-run)', () => {
    expect(matchTier(hh('H.T.H'))).toBeNull()
    expect(matchTier(hh('H.H.H'))).toBe('tripleRun')
  })

  it('an empty hand (deck depleted) matches no tier', () => {
    expect(matchTier(hh('.....'))).toBeNull()
  })
})

describe('resolveFace', () => {
  it('plain coin: 50/50, one rng draw', () => {
    expect(resolveFace(fakeRng([0.1]), coin([]), null)).toBe('H')
    expect(resolveFace(fakeRng([0.9]), coin([]), null)).toBe('T')
    const values = [0.5]
    resolveFace(fakeRng(values), coin([]), null)
    expect(values).toHaveLength(0)
  })

  it('weight: 75/25 toward the rolled param face', () => {
    expect(resolveFace(fakeRng([0.1]), coin(['weight'], 'H'), null)).toBe('H')
    expect(resolveFace(fakeRng([0.7]), coin(['weight'], 'H'), null)).toBe('H')
    expect(resolveFace(fakeRng([0.8]), coin(['weight'], 'H'), null)).toBe('T')
    expect(resolveFace(fakeRng([0.1]), coin(['weight'], 'T'), null)).toBe('T')
    expect(resolveFace(fakeRng([0.8]), coin(['weight'], 'T'), null)).toBe('H')
  })

  it('doubleSide: 100/0 toward the rolled param face', () => {
    expect(resolveFace(fakeRng([0.99]), coin(['doubleSide'], 'H'), null)).toBe('H')
    expect(resolveFace(fakeRng([0.01]), coin(['doubleSide'], 'T'), null)).toBe('T')
  })

  it('chaos: random odds (two rng draws: odds roll + face roll)', () => {
    // odds 0.3, roll 0.2 < 0.3 → H
    expect(resolveFace(fakeRng([0.3, 0.2]), coin(['chaos']), null)).toBe('H')
    // odds 0.3, roll 0.5 > 0.3 → T
    expect(resolveFace(fakeRng([0.3, 0.5]), coin(['chaos']), null)).toBe('T')
    const values = [0.3, 0.2]
    resolveFace(fakeRng(values), coin(['chaos']), null)
    expect(values).toHaveLength(0)
  })

  it('magnetic: 75/25 toward the left neighbor; no bias without one', () => {
    expect(resolveFace(fakeRng([0.1]), coin(['magnetic']), 'H')).toBe('H')
    expect(resolveFace(fakeRng([0.8]), coin(['magnetic']), 'H')).toBe('T')
    expect(resolveFace(fakeRng([0.1]), coin(['magnetic']), 'T')).toBe('T')
    expect(resolveFace(fakeRng([0.8]), coin(['magnetic']), 'T')).toBe('H')
    // no left neighbor → falls back to base 50/50
    expect(resolveFace(fakeRng([0.1]), coin(['magnetic']), null)).toBe('H')
    expect(resolveFace(fakeRng([0.9]), coin(['magnetic']), null)).toBe('T')
  })

  it('reverse: inverts the resolved face', () => {
    expect(resolveFace(fakeRng([0.1]), coin(['reverse']), null)).toBe('T')
    expect(resolveFace(fakeRng([0.9]), coin(['reverse']), null)).toBe('H')
    // weight + reverse: 75/25 toward the OPPOSITE of param
    expect(resolveFace(fakeRng([0.1]), coin(['weight', 'reverse'], 'H'), null)).toBe('T')
    expect(resolveFace(fakeRng([0.8]), coin(['weight', 'reverse'], 'H'), null)).toBe('H')
  })

  it('odds-stage priority: magnetic > doubleSide > chaos > weight', () => {
    // magnetic beats doubleSide: 75/25 toward leftFace, not 100/0 toward param
    expect(resolveFace(fakeRng([0.8]), coin(['magnetic', 'doubleSide'], 'H'), 'H')).toBe('T')
    // doubleSide beats chaos: fixed face, one draw
    const values = [0.99]
    expect(resolveFace(fakeRng(values), coin(['chaos', 'doubleSide'], 'H'), null)).toBe('H')
    expect(values).toHaveLength(0)
    // chaos beats weight: two draws, random odds
    const values2 = [0.3, 0.2]
    expect(resolveFace(fakeRng(values2), coin(['weight', 'chaos'], 'T'), null)).toBe('H')
    expect(values2).toHaveLength(0)
  })

  it('same seed → same face (reproducible)', () => {
    const a = createRng('abc')
    const b = createRng('abc')
    const c = coin(['chaos', 'reverse'])
    const seqA = Array.from({ length: 20 }, () => resolveFace(a, c, 'H'))
    const seqB = Array.from({ length: 20 }, () => resolveFace(b, c, 'H'))
    expect(seqA).toEqual(seqB)
  })

  it('weight is ~75/25 and chaos is ~uniform over many flips', () => {
    const rng = createRng('stats')
    let heads = 0
    for (let i = 0; i < 10_000; i++) {
      if (resolveFace(rng, coin(['weight'], 'H'), null) === 'H') heads++
    }
    expect(heads / 10_000).toBeGreaterThan(0.7)
    expect(heads / 10_000).toBeLessThan(0.8)

    const rng2 = createRng('stats2')
    let chaosHeads = 0
    for (let i = 0; i < 10_000; i++) {
      if (resolveFace(rng2, coin(['chaos']), null) === 'H') chaosHeads++
    }
    expect(chaosHeads / 10_000).toBeGreaterThan(0.4)
    expect(chaosHeads / 10_000).toBeLessThan(0.6)
  })
})

describe('scoreHand', () => {
  it('total = tier chips × mult, for every tier (plain full hands)', () => {
    const rng = createRng('abc')
    for (const tier of TIERS) {
      const hand = Object.keys(ALL_HANDS).find((s) => ALL_HANDS[s] === tier.id)!
      expect(scoreHand(hh(hand), rng)).toEqual({
        tier: tier.id,
        chips: tier.chips,
        mult: tier.mult,
        total: tier.chips * tier.mult,
        cash: 0,
      })
    }
  })

  it('expected value over all 32 plain full hands is 58.4375 (balance baseline)', () => {
    const rng = createRng('ev')
    const total = Object.keys(ALL_HANDS).reduce(
      (sum, s) => sum + scoreHand(hh(s), rng).total,
      0,
    )
    expect(total).toBe(1870)
    expect(total / 32).toBe(58.4375)
  })

  it('short hands score lower: HHH + 2 empty slots = Triple-run (40), not Jackpot', () => {
    expect(scoreHand(hh('HHH..'), fakeRng([]))).toEqual({
      tier: 'tripleRun',
      chips: 20,
      mult: 2,
      total: 40,
      cash: 0,
    })
  })

  it('a 1-coin hand scores 0 with no tier (≤2 coins match nothing)', () => {
    expect(scoreHand(hh('H....'), fakeRng([]))).toEqual({
      tier: null,
      chips: 0,
      mult: 0,
      total: 0,
      cash: 0,
    })
  })

  it('an empty hand scores 0 with no tier', () => {
    expect(scoreHand(hh('.....'), fakeRng([]))).toEqual({
      tier: null,
      chips: 0,
      mult: 0,
      total: 0,
      cash: 0,
    })
  })

  it('tax: +$1 cash per Tax coin in the hand, outside chips × mult', () => {
    const hand = hh('HTHTH')
    hand[0] = { ...hand[0]!, coin: coin(['tax']) }
    hand[2] = { ...hand[2]!, coin: coin(['tax']) }
    expect(scoreHand(hand, fakeRng([])).cash).toBe(2)
  })

  it('jackpot: 25% chance per coin for +$4 cash (one rng draw per coin)', () => {
    const hand = hh('HTHTH')
    hand[0] = { ...hand[0]!, coin: coin(['jackpot']) }
    hand[1] = { ...hand[1]!, coin: coin(['jackpot']) }
    // both rolls under 0.25 → +$8
    expect(scoreHand(hand, fakeRng([0.1, 0.2])).cash).toBe(8)
    // one roll over → +$4
    expect(scoreHand(hand, fakeRng([0.1, 0.5])).cash).toBe(4)
    // both over → $0
    expect(scoreHand(hand, fakeRng([0.5, 0.9])).cash).toBe(0)
  })
})
