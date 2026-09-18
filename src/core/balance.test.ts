import { describe, expect, it } from 'vitest'
import {
  BASE_DECK_SIZE,
  BLINDS,
  BOSS_RULES,
  TIERS,
  HANDS_PER_BLIND,
  HEAVY_TARGET_BONUS,
  JACKPOT_CHANCE,
  JACKPOT_PAYOUT,
  MAGNETIC_ODDS,
  PAYDAY_BONUS,
  SHORT_FUSE_HANDS,
  START_CASH,
  STARTER_WEIGHT_COINS,
  TAX_PAYOUT,
  WEIGHT_ODDS,
} from './balance'
import { CHARMS, COIN_EFFECTS, FREE_REROLLS, REMOVE_COIN_COST, SHOP_SLOTS } from './shop'

describe('TIERS', () => {
  it('6 tiers in priority order with baseline chips × mult', () => {
    expect(TIERS).toEqual([
      { id: 'jackpot', name: 'Jackpot', chips: 50, mult: 4 },
      { id: 'fourRow', name: '4-in-a-row', chips: 40, mult: 3 },
      { id: 'alternating', name: 'Alternating', chips: 35, mult: 3 },
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
    expect(BLINDS.map((b) => b.reward)).toEqual([4, 6, 10, 4, 6, 10, 4, 6, 10, 4, 6, 10])
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

describe('CHARMS', () => {
  it('5-charm pool with baseline categories and prices (Re-Toss removed 2026-09-13; Extra Hand $10→$15 in 13a.11)', () => {
    expect(CHARMS.map((c) => [c.id, c.category, c.price])).toEqual([
      ['plusChips', 'scoring', 5],
      ['plusMult', 'scoring', 8],
      ['extraHand', 'flip', 15],
      ['payday', 'economy', 5],
      ['jackpotFever', 'pattern', 12],
    ])
  })
})

describe('COIN_EFFECTS', () => {
  it('v1 core set: 7 effect coins + 3 draw tiers, with baseline prices', () => {
    expect(COIN_EFFECTS.map((c) => [c.effect, c.price])).toEqual([
      ['weight', 5],
      ['heads', 8],
      ['tails', 8],
      ['chaos', 6],
      ['echo', 7],
      ['magnetic', 6],
      ['reverse', 5],
      ['tax', 5],
      ['jackpot', 10],
      ['draw1', 5],
      ['draw2', 8],
      ['draw3', 12],
    ])
  })
})

describe('constants', () => {
  it('baseline constants (m13a rebalance 2026-09-15 — 4 hands, 24 mixed deck, halved targets)', () => {
    expect(HANDS_PER_BLIND).toBe(4)
    expect(SHORT_FUSE_HANDS).toBe(3)
    expect(START_CASH).toBe(4)
    expect(SHOP_SLOTS).toBe(5)
    expect(FREE_REROLLS).toBe(1)
    expect(PAYDAY_BONUS).toBe(5)
    expect(HEAVY_TARGET_BONUS).toBe(5)
    expect(BASE_DECK_SIZE).toBe(24)
    expect(STARTER_WEIGHT_COINS).toBe(8)
    expect(REMOVE_COIN_COST).toBe(1)
    expect(TAX_PAYOUT).toBe(1)
    expect(JACKPOT_CHANCE).toBe(0.25)
    expect(JACKPOT_PAYOUT).toBe(4)
    expect(WEIGHT_ODDS).toBe(0.75)
    expect(MAGNETIC_ODDS).toBe(0.75)
  })
})
