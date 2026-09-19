import { describe, expect, it } from 'vitest'
import {
  BASE_DECK_SIZE,
  BLINDS,
  BOSS_RULES,
  DIFFICULTY,
  TIERS,
  HANDS_PER_BLIND,
  HEAVY_TARGET_BONUS,
  SHORT_FUSE_HANDS,
  START_CASH,
} from './balance'
import { SHOP_SLOTS } from './shop'

describe('TIERS', () => {
  it('6 tiers in priority order with baseline chips × mult', () => {
    expect(TIERS).toEqual([
      { id: 'jackpot', name: 'Jackpot', chips: 50, mult: 4 },
      { id: 'fourRow', name: '4-in-a-row', chips: 40, mult: 3 },
      { id: 'alternating', name: 'Alternating', chips: 45, mult: 4 },
      { id: 'fourSame', name: '4-same', chips: 30, mult: 2 },
      { id: 'tripleRun', name: 'Triple-run', chips: 20, mult: 2 },
      { id: 'threeSame', name: '3-same', chips: 15, mult: 1 },
    ])
  })
})

describe('BLINDS', () => {
  it('12 blinds: 4 rounds × small/big/boss, escalating targets', () => {
    expect(BLINDS.map((b) => b.round)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
    expect(BLINDS.map((b) => b.kind)).toEqual([
      'small', 'big', 'boss',
      'small', 'big', 'boss',
      'small', 'big', 'boss',
      'small', 'big', 'boss',
    ])
    expect(BLINDS.map((b) => b.target)).toEqual([150, 250, 400, 300, 500, 750, 500, 800, 1200, 750, 1200, 1750]) // m13a: halved
    expect(BLINDS.map((b) => b.reward)).toEqual([4, 6, 10, 4, 6, 10, 4, 6, 10, 4, 6, 10].map((r) => r * DIFFICULTY))
  })

  it('one boss rule per round, carried inside the boss variant (no rule on small/big)', () => {
    expect(BLINDS.map((b) => (b.kind === 'boss' ? b.rule : null))).toEqual([
      null, null, 'noAlternating',
      null, null, 'shortFuse',
      null, null, 'noJackpots',
      null, null, 'heavyTarget',
    ])
  })
})

describe('BOSS_RULES', () => {
  it('4 fixed rules, one per round', () => {
    expect(BOSS_RULES.map((r) => r.id)).toEqual(['noAlternating', 'shortFuse', 'noJackpots', 'heavyTarget'])
  })
})

describe('constants', () => {
  it('baseline constants (m13a rebalance 2026-09-15 — 4 hands, 24 mixed deck, halved targets)', () => {
    expect(HANDS_PER_BLIND).toBe(4)
    expect(SHORT_FUSE_HANDS).toBe(3)
    expect(START_CASH).toBe(4 * DIFFICULTY)
    expect(SHOP_SLOTS).toBe(5)
    expect(HEAVY_TARGET_BONUS).toBe(5 * DIFFICULTY)
    expect(BASE_DECK_SIZE).toBe(24)
  })
})
