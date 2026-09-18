// M10 — Blind progression (handActions + shopActions via runStore).
//
// M10.3 leaveShop (next blind), M10.4 endBlind rewards (Payday / Heavy Target),
// M10.5 clearing blind 11 wins, M10.6 boss-rule scope, M10.7 miss after the
// hand budget loses, M10.8 full 12-blind walk.

import { describe, expect, it } from 'vitest'
import { BLINDS, HANDS_PER_BLIND, HAND_SIZE, HEAVY_TARGET_BONUS, HEAVY_TARGET_MULT, PAYDAY_BONUS, PLAY_SIZE, SHOP_SLOTS, SHORT_FUSE_HANDS, START_CASH } from '@/core/balance'
import { filledSlot } from '@/core/helpers'
import type { Face } from '@/core/types'
import { createRunStore, type RunStore } from './runStore'

describe('M10.3 — leaveShop (next blind)', () => {
  it('advances the blind: reshuffle, discard cleared, blindScore/hand/play reset, phase run', () => {
    const store = createRunStore()
    store.getState().startRun('m10-3')
    store.setState({
      phase: 'shop',
      blindScore: 123,
      deck: {
        drawPile: [{ id: 500, effects: [] }],
        discardPile: [
          { id: 501, effects: [] },
          { id: 502, effects: [] },
        ],
      },
    })

    store.getState().leaveShop()
    const st = store.getState()
    expect(st.phase).toBe('run')
    expect(st.handPhase).toBe('draw')
    expect(st.blindIndex).toBe(1)
    expect(st.round).toBe(1)
    expect(st.blindScore).toBe(0)
    expect(st.handsLeft).toBe(HANDS_PER_BLIND)
    expect(st.hand).toHaveLength(HAND_SIZE)
    expect(st.hand.every((s) => s.kind === 'empty')).toBe(true)
    expect(st.play).toHaveLength(PLAY_SIZE)
    // discard merged into the (shuffled) draw pile and cleared
    expect(st.deck.discardPile).toHaveLength(0)
    expect(st.deck.drawPile).toHaveLength(3)
    expect(st.deck.drawPile.map((c) => c.id).sort((a, b) => a - b)).toEqual([500, 501, 502])
    expect(st.shop.offers).toHaveLength(0)
  })

  it('into a Short Fuse boss: handsLeft = SHORT_FUSE_HANDS', () => {
    const store = createRunStore()
    store.getState().startRun('m10-3b')
    store.setState({ phase: 'shop', blindIndex: 4, round: 2 }) // next: blind 5 = round 2 boss (shortFuse)

    store.getState().leaveShop()
    expect(store.getState().blindIndex).toBe(5)
    expect(store.getState().handsLeft).toBe(SHORT_FUSE_HANDS)
  })

  it('Extra Hand charm: +1 hand (both normal and Short Fuse)', () => {
    for (const [from, base] of [
      [0, HANDS_PER_BLIND],
      [4, SHORT_FUSE_HANDS],
    ] as const) {
      const store = createRunStore()
      store.getState().startRun(`m10-3c-${from}`)
      store.setState({ phase: 'shop', blindIndex: from, charms: ['extraHand'] })
      store.getState().leaveShop()
      expect(store.getState().handsLeft).toBe(base + 1)
    }
  })

  it('no-op out of the shop phase', () => {
    const store = createRunStore()
    store.getState().startRun('m10-3d')
    const before = store.getState()
    store.getState().leaveShop()
    expect(store.getState()).toEqual(before)
  })
})

describe('M10.4 — endBlind rewards', () => {
  /** Clears (or misses) the given blind with one 0-score hand. */
  function endBlindStore(
    seed: string,
    blindIndex: number,
    blindScore: number,
    charms: RunStore['charms'] = [],
  ) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      blindIndex,
      round: BLINDS[blindIndex].round,
      blindScore,
      handsLeft: 1,
      charms,
    })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    return store
  }

  it('target met: cash += reward, phase shop', () => {
    const store = endBlindStore('m10-4', 0, 150)
    const st = store.getState()
    expect(st.phase).toBe('shop')
    expect(st.cash).toBe(START_CASH + BLINDS[0].reward) // 4 + 4
  })

  it('Payday charm adds +$5 to the reward', () => {
    const store = endBlindStore('m10-4b', 0, 150, ['payday'])
    expect(store.getState().cash).toBe(START_CASH + BLINDS[0].reward + PAYDAY_BONUS)
  })

  it('Heavy Target boss: the effective target is ×1.5 (1750 → 2625)', () => {
    const missed = endBlindStore('m10-4c', 11, 2624)
    expect(missed.getState().won).toBe(false)
    expect(missed.getState().phase).toBe('runEnd')
  })

  it('target missed: runEnd lose, no reward paid', () => {
    const store = endBlindStore('m10-4d', 0, 149)
    expect(store.getState().phase).toBe('runEnd')
    expect(store.getState().won).toBe(false)
    expect(store.getState().cash).toBe(START_CASH) // no reward on a miss
  })
})

describe('M10.5 — clearing blind 11 (round 4 boss) wins the run', () => {
  it('blindScore ≥ 2625 on the last blind → phase runEnd, won = true, boss reward + Heavy Target bonus paid', () => {
    const store = createRunStore()
    store.getState().startRun('m10-5')
    store.setState({ blindIndex: 11, round: 4, blindScore: 2625, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    const st = store.getState()

    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(true)
    expect(st.cash).toBe(START_CASH + BLINDS[11].reward + HEAVY_TARGET_BONUS) // 4 + 10 + 5
  })

  it('one point short (2624) → lose, not win', () => {
    const store = createRunStore()
    store.getState().startRun('m10-5b')
    store.setState({ blindIndex: 11, round: 4, blindScore: 2624, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    expect(store.getState().won).toBe(false)
  })
})

describe('M10.6 — a round’s boss rule fires only on its boss blind', () => {
  /** Score a deterministic pre-resolved play on the given blind; returns the blind score. */
  function scorePlayOnBlind(seed: string, blindIndex: number, faces: Face[]): number {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      blindIndex,
      round: BLINDS[blindIndex].round,
      handPhase: 'buff',
      handsLeft: 1,
      play: [
        ...faces.map((face, i) => filledSlot({ id: i + 1, effects: [] }, face)),
        ...Array.from({ length: PLAY_SIZE - faces.length }, () => ({ kind: 'empty' as const })),
      ],
    })
    store.getState().score()
    return store.getState().blindScore
  }

  it('No Alternating (round 1 boss): HTHTH scores 105 on small/big, 0 on the boss blind', () => {
    const faces: Face[] = ['H', 'T', 'H', 'T', 'H']
    expect(scorePlayOnBlind('m10-6', 0, faces)).toBe(105) // round 1 small — no rule
    expect(scorePlayOnBlind('m10-6b', 1, faces)).toBe(105) // round 1 big — no rule
    expect(scorePlayOnBlind('m10-6c', 2, faces)).toBe(0) // round 1 boss — noAlternating
  })

  it('No Jackpots (round 3 boss): HHHHH scores 200 on small/big, 60 (4-same) on the boss blind', () => {
    const faces: Face[] = ['H', 'H', 'H', 'H', 'H']
    expect(scorePlayOnBlind('m10-6d', 6, faces)).toBe(200) // round 3 small — no rule
    expect(scorePlayOnBlind('m10-6e', 7, faces)).toBe(200) // round 3 big — no rule
    expect(scorePlayOnBlind('m10-6f', 8, faces)).toBe(60) // round 3 boss — noJackpots
  })
})

describe('M10.7 — miss the target after the hand budget → lose (even with cash left)', () => {
  it('last hand scores below the target: runEnd lose, cash untouched (no reward)', () => {
    const store = createRunStore()
    store.getState().startRun('m10-7')
    store.setState({ blindScore: 149, handsLeft: 1, cash: 50 })
    store.getState().drawHand()
    store.getState().pickCoin(0) // a lone coin scores no tier → 0
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    const st = store.getState()

    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(false)
    expect(st.cash).toBe(50) // cash is not a substitute for the target
    expect(st.handsLeft).toBe(0)
  })
})

describe('M10.8 — full 12-blind walk (mocked clears) reaches win', () => {
  it('every blind clears → shop → next blind; blind 11 → runEnd win; no undefined transition', () => {
    const store = createRunStore()
    store.getState().startRun('m10-8')

    for (let i = 0; i < BLINDS.length; i++) {
      const blind = BLINDS[i]
      const target =
        blind.kind === 'boss' && blind.rule === 'heavyTarget'
          ? blind.target * HEAVY_TARGET_MULT
          : blind.target
      store.setState({ blindIndex: i, round: blind.round, blindScore: target, handsLeft: 1 })
      store.getState().drawHand()
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
      store.getState().score()
      store.getState().finishScore()

      const st = store.getState()
      if (i === BLINDS.length - 1) {
        expect(st.phase).toBe('runEnd')
        expect(st.won).toBe(true)
      } else {
        // clear → shop with a full offer row → leave → the next blind, fresh
        expect(st.phase).toBe('shop')
        expect(st.shop.offers).toHaveLength(SHOP_SLOTS)
        store.getState().leaveShop()
        const next = store.getState()
        expect(next.phase).toBe('run')
        expect(next.blindIndex).toBe(i + 1)
        expect(next.round).toBe(BLINDS[i + 1].round)
        expect(next.blindScore).toBe(0)
        expect(next.handsLeft).toBeGreaterThan(0)
      }
    }
    expect(store.getState().won).toBe(true)
  })
})

describe('13a.4 — early clear: leftover hands convert to money', () => {
  /** Plays `hands` 1-coin (0-score) hands, then a 3-same (15) hand that pushes
   *  blindScore over the round-1 small target (150). Returns the store. */
  function clearOnHand(seed: string, hands: number, charms: RunStore['charms'] = []) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({ blindScore: 135, charms }) // 135 + 15 (3-same) = 150 = target
    for (let h = 0; h < hands; h++) {
      store.getState().drawHand()
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
      if (h < hands - 1) {
        store.getState().score() // 1 coin → 0, keeps playing
        store.getState().finishScore()
      } else {
        // The clearing hand: 3-same = 15 chips × 1 = 15 → blindScore 150.
        store.setState({
          handPhase: 'buff',
          play: [
            filledSlot({ id: 101, effects: [] }, 'H'),
            filledSlot({ id: 102, effects: [] }, 'H'),
            filledSlot({ id: 103, effects: [] }, 'H'),
            { kind: 'empty' },
            { kind: 'empty' },
          ],
        })
        store.getState().score()
        store.getState().finishScore()
      }
    }
    return store
  }

  it('clearing on hand 2 of 4 ends the blind and pays +$2 for hands 3–4', () => {
    const store = clearOnHand('m13a-4a', 2)
    const st = store.getState()
    expect(st.phase).toBe('shop')
    expect(st.handsLeft).toBe(HANDS_PER_BLIND - 2) // 2 unused hands
    expect(st.earlyClearBonus).toBe(2) // +$1 × 2
    expect(st.cash).toBe(START_CASH + BLINDS[0].reward + 2) // 4 + 4 + 2
  })

  it('clearing on the last hand pays no early-clear bonus', () => {
    const store = clearOnHand('m13a-4b', HANDS_PER_BLIND)
    const st = store.getState()
    expect(st.phase).toBe('shop')
    expect(st.handsLeft).toBe(0)
    expect(st.earlyClearBonus).toBe(0)
    expect(st.cash).toBe(START_CASH + BLINDS[0].reward) // 4 + 4
  })

  it('early-clear bonus stacks with the Payday charm reward', () => {
    const store = clearOnHand('m13a-4c', 2, ['payday'])
    const st = store.getState()
    expect(st.cash).toBe(START_CASH + BLINDS[0].reward + PAYDAY_BONUS + 2) // 4 + 4 + 5 + 2
    expect(st.earlyClearBonus).toBe(2)
  })

  it('early clear on the final blind wins the run and pays the bonus', () => {
    const store = createRunStore()
    store.getState().startRun('m13a-4d')
    store.setState({
      blindIndex: 11,
      round: 4,
      blindScore: 1750 * HEAVY_TARGET_MULT - 15, // 2625 − 15
      handsLeft: 3,
    })
    store.getState().drawHand()
    store.setState({
      handPhase: 'buff',
      play: [
        filledSlot({ id: 101, effects: [] }, 'H'),
        filledSlot({ id: 102, effects: [] }, 'H'),
        filledSlot({ id: 103, effects: [] }, 'H'),
        { kind: 'empty' },
        { kind: 'empty' },
      ],
    })
    store.getState().score()
    store.getState().finishScore()
    const st = store.getState()
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(true)
    expect(st.earlyClearBonus).toBe(2) // handsLeft 3 → 2 after the clearing hand
    expect(st.cash).toBe(START_CASH + BLINDS[11].reward + HEAVY_TARGET_BONUS + 2)
  })

  it('missing the target still plays out the full hand budget (no early end)', () => {
    const store = createRunStore()
    store.getState().startRun('m13a-4e')
    store.setState({ blindScore: 0 })
    for (let h = 0; h < HANDS_PER_BLIND - 1; h++) {
      store.getState().drawHand()
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
      store.getState().score() // 0 each
      store.getState().finishScore()
      expect(store.getState().phase).toBe('run') // still in the blind
    }
    // Last hand: still 0 → the blind ends on the budget, not early.
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    const st = store.getState()
    expect(st.phase).toBe('runEnd')
    expect(st.won).toBe(false)
    expect(st.earlyClearBonus).toBe(0)
  })
})
