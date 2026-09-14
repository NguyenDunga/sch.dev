import { describe, expect, it } from 'vitest'
import { scoreHand } from '@/core/scoring'
import { BASE_DECK_SIZE, BLINDS, HANDS_PER_BLIND } from '@/core/balance'
import type { Coin, Slot } from '@/core/types'
import { createRunStore } from './runStore'

type Store = ReturnType<typeof createRunStore>

const plain = (id: number, face: 'H' | 'T'): Slot => ({
  coin: { id, effects: [] },
  face,
  echoUsed: false,
})

const special = (id: number, effects: Coin['effects'], face: 'H' | 'T'): Slot => ({
  coin: { id, effects },
  face,
  echoUsed: false,
})

/** Toss one full hand (or as many coins as the draw pile allows). */
function playHand(store: Store) {
  for (let slot = 0; slot < 5; slot++) store.getState().tossSlot(slot)
  store.getState().score()
}

describe('runStore', () => {
  it('newRun starts a run with a shuffled 80-coin collection and blind 1', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const s = store.getState()
    expect(s.phase).toBe('run')
    expect(s.seed).toBe('test123')
    expect(s.hand).toEqual([null, null, null, null, null])
    expect(s.handState).toBe('ready')
    expect(s.deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    expect(s.deck.discardPile).toHaveLength(0)
    expect(s.blindIndex).toBe(0)
    expect(s.handsLeft).toBe(HANDS_PER_BLIND)
    expect(s.blindScore).toBe(0)
    expect(s.lastScore).toBeNull()
    expect(s.won).toBe(false)
  })

  it('newRun without a seed generates an 8-char seed', () => {
    const store = createRunStore()
    store.getState().newRun()
    expect(store.getState().seed).toMatch(/^[a-z0-9]{8}$/)
  })

  it('tossSlot draws a coin from the draw pile and resolves its face', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const topCoin = store.getState().deck.drawPile[0]
    store.getState().tossSlot(0)
    const s = store.getState()
    expect(s.hand[0]?.coin.id).toBe(topCoin.id)
    expect(s.hand[0]?.face).toBeOneOf(['H', 'T'])
    expect(s.hand.slice(1)).toEqual([null, null, null, null])
    expect(s.handState).toBe('ready')
    expect(s.deck.drawPile).toHaveLength(BASE_DECK_SIZE - 1)
    expect(s.tosses[0]).toBe(1)
  })

  it('the hand completes (toss window) when all 5 slots are filled', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    for (let slot = 0; slot < 4; slot++) store.getState().tossSlot(slot)
    expect(store.getState().handState).toBe('ready')
    store.getState().tossSlot(4)
    expect(store.getState().handState).toBe('tossed')
  })

  it('score accumulates the blind score, resets the hand, and counts down hands', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    for (let slot = 0; slot < 5; slot++) store.getState().tossSlot(slot)
    const hand = store.getState().hand
    store.getState().score()
    const s = store.getState()
    expect(s.lastScore).toEqual(scoreHand(hand, { next: () => 0, state: () => [] }))
    expect(s.blindScore).toBe(s.lastScore!.total)
    expect(s.handsLeft).toBe(HANDS_PER_BLIND - 1)
    expect(s.hand).toEqual([null, null, null, null, null])
    expect(s.handState).toBe('ready')
  })

  it('discard sends a plain coin to the discard pile (gone for the blind)', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [
      plain(100, 'H'),
      plain(101, 'T'),
      null,
      null,
      null,
    ]
    store.setState({ hand, handState: 'tossed' })
    const deckBefore = store.getState().deck
    store.getState().discard(0)
    const s = store.getState()
    expect(s.hand[0]).toBeNull()
    expect(s.hand[1]).toEqual(plain(101, 'T'))
    expect(s.deck.discardPile).toEqual([hand[0]!.coin])
    expect(s.deck.drawPile).toEqual(deckBefore.drawPile)
  })

  it('discard of a draw-1 coin redraws one coin into the slot', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [
      special(100, ['draw1'], 'H'),
      plain(101, 'T'),
      null,
      null,
      null,
    ]
    store.setState({ hand, handState: 'tossed' })
    const deckBefore = store.getState().deck
    const topCoin = deckBefore.drawPile[0]
    store.getState().discard(0)
    const s = store.getState()
    expect(s.hand[0]?.coin.id).toBe(topCoin.id)
    expect(s.hand[0]?.echoUsed).toBe(false)
    expect(s.tosses[0]).toBe(1)
    expect(s.deck.discardPile).toEqual([hand[0]!.coin])
    expect(s.deck.drawPile).toHaveLength(deckBefore.drawPile.length - 1)
    expect(s.deck.drawPile[0]?.id).not.toBe(topCoin.id)
  })

  it('discard of a draw-3 coin redraws into empty slots: discarded slot first, then left-to-right', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [
      special(100, ['draw3'], 'H'),
      plain(101, 'T'),
      null,
      null,
      null,
    ]
    store.setState({ hand, handState: 'tossed' })
    const pile = store.getState().deck.drawPile
    store.getState().discard(0)
    const s = store.getState()
    // slots 0, 2, 3 refilled (slot 1 is occupied); slot 4 stays empty
    expect(s.hand[0]?.coin.id).toBe(pile[0].id)
    expect(s.hand[1]).toEqual(plain(101, 'T'))
    expect(s.hand[2]?.coin.id).toBe(pile[1].id)
    expect(s.hand[3]?.coin.id).toBe(pile[2].id)
    expect(s.hand[4]).toBeNull()
    expect(s.deck.drawPile).toHaveLength(pile.length - 3)
  })

  it('discard is a no-op before the toss window or on an empty slot', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [plain(100, 'H'), null, null, null, null]
    store.setState({ hand })
    store.getState().discard(0) // handState still 'ready'
    expect(store.getState().hand[0]).toEqual(plain(100, 'H'))
    store.setState({ handState: 'tossed' })
    store.getState().discard(1) // empty slot
    expect(store.getState().hand).toEqual(hand)
  })

  it('echoReflip re-resolves an Echo coin once, then is a no-op', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [
      special(100, ['echo'], 'H'),
      plain(101, 'T'),
      null,
      null,
      null,
    ]
    store.setState({ hand, handState: 'tossed' })
    expect(store.getState().tosses[0]).toBe(0)
    store.getState().echoReflip(0)
    let s = store.getState()
    expect(s.hand[0]?.echoUsed).toBe(true)
    expect(s.tosses[0]).toBe(1)
    const afterFirst = s.hand[0]!
    store.getState().echoReflip(0)
    s = store.getState()
    expect(s.hand[0]).toEqual(afterFirst)
    expect(s.tosses[0]).toBe(1)
  })

  it('echoReflip is a no-op on non-Echo coins or before the toss window', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    const hand: (Slot | null)[] = [plain(100, 'H'), null, null, null, null]
    store.setState({ hand })
    store.getState().echoReflip(0)
    expect(store.getState().hand[0]).toEqual(plain(100, 'H'))
  })

  it('openTossWindow opens the toss window with 1–5 coins (free 1–5 toss, Q&A round 4)', () => {
    const store = createRunStore()
    store.getState().newRun('free15')
    store.getState().tossSlot(0)
    expect(store.getState().handState).toBe('ready')
    store.getState().openTossWindow()
    expect(store.getState().handState).toBe('tossed')
    // a 1-coin play scores 0 (≤2 coins match no tier — empty slots are nothing)
    store.getState().score()
    expect(store.getState().lastScore).toEqual({ tier: null, chips: 0, mult: 0, total: 0, cash: 0 })
    expect(store.getState().handsLeft).toBe(HANDS_PER_BLIND - 1)
  })

  it('openTossWindow is a no-op with 0 coins tossed or once the window is open', () => {
    const store = createRunStore()
    store.getState().newRun('free0')
    store.getState().openTossWindow() // 0 coins tossed
    expect(store.getState().handState).toBe('ready')
    store.getState().tossSlot(0)
    store.getState().openTossWindow()
    store.getState().openTossWindow() // already open — no-op
    expect(store.getState().handState).toBe('tossed')
  })

  it('the hand shrinks when the draw pile runs out (empty slots count as nothing)', () => {
    const store = createRunStore()
    store.getState().newRun('shrink1')
    // leave 3 coins in the draw pile
    store.setState({
      deck: { drawPile: store.getState().deck.drawPile.slice(0, 3), discardPile: [] },
    })
    for (let slot = 0; slot < 2; slot++) store.getState().tossSlot(slot)
    expect(store.getState().handState).toBe('ready')
    store.getState().tossSlot(2) // 3rd coin — pile now empty, window opens with a 3-coin hand
    const hand = store.getState().hand
    expect(store.getState().handState).toBe('tossed')
    expect(hand.filter((x) => x !== null)).toHaveLength(3)
    store.getState().score()
    // a 3-coin hand scores only if it is HHH/TTT (Triple-run); empty slots are nothing
    expect(store.getState().lastScore).toEqual(
      scoreHand(hand, { next: () => 0, state: () => [] }),
    )
  })

  it('an empty draw pile opens the toss window with an empty hand (scores 0)', () => {
    const store = createRunStore()
    store.getState().newRun('empty1')
    store.setState({ deck: { drawPile: [], discardPile: [] } })
    store.getState().tossSlot(0) // nothing left to draw — window opens immediately
    expect(store.getState().handState).toBe('tossed')
    expect(store.getState().hand).toEqual([null, null, null, null, null])
    store.getState().score()
    expect(store.getState().lastScore).toEqual({ tier: null, chips: 0, mult: 0, total: 0, cash: 0 })
  })

  it('a partial hand completes as soon as the draw pile is empty', () => {
    const store = createRunStore()
    store.getState().newRun('partial')
    // leave 2 coins in the draw pile
    store.setState({
      deck: { drawPile: store.getState().deck.drawPile.slice(0, 2), discardPile: [] },
    })
    store.getState().tossSlot(0)
    expect(store.getState().handState).toBe('ready')
    store.getState().tossSlot(1) // 2nd coin — pile now empty
    const s = store.getState()
    expect(s.handState).toBe('tossed')
    expect(s.hand.filter((x) => x !== null)).toHaveLength(2)
    s.score()
    expect(store.getState().handsLeft).toBe(HANDS_PER_BLIND - 1)
  })

  it('clearing a small blind auto-advances to the next blind with a reshuffled deck', () => {
    const store = createRunStore()
    store.getState().newRun('advance')
    store.setState({ blindScore: 99999, handsLeft: 1 }) // force the clear
    playHand(store)
    const s = store.getState()
    expect(s.phase).toBe('run')
    expect(s.blindIndex).toBe(1)
    expect(s.blindScore).toBe(0)
    expect(s.handsLeft).toBe(HANDS_PER_BLIND)
    expect(s.hand).toEqual([null, null, null, null, null])
    expect(s.handState).toBe('ready')
    // blind start: whole collection reshuffled into the draw pile, discard cleared
    expect(s.deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    expect(s.deck.discardPile).toHaveLength(0)
  })

  it('clearing a boss blind auto-advances to the next round', () => {
    const store = createRunStore()
    store.getState().newRun('boss1')
    expect(store.getState().phase).toBe('run')
    store.setState({ blindIndex: 2, blindScore: 99999, handsLeft: 1 }) // round-1 boss, force the clear
    playHand(store)
    const s = store.getState()
    expect(s.phase).toBe('run')
    expect(s.blindIndex).toBe(3)
    expect(BLINDS[s.blindIndex].round).toBe(2)
    expect(s.blindScore).toBe(0)
    expect(s.handsLeft).toBe(HANDS_PER_BLIND)
    expect(s.deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    expect(s.deck.discardPile).toHaveLength(0)
  })

  it('a full run: 12 blinds (small → big → boss × 4 rounds), win at blind 12', () => {
    const store = createRunStore()
    store.getState().newRun('fullrun')
    const rounds: number[] = []
    for (let blind = 0; blind < BLINDS.length; blind++) {
      store.setState({ blindScore: 99999, handsLeft: 1 }) // force every clear
      rounds.push(BLINDS[store.getState().blindIndex].round)
      playHand(store)
      if (blind < BLINDS.length - 1) {
        expect(store.getState().phase).toBe('run')
        expect(store.getState().blindIndex).toBe(blind + 1)
      }
    }
    expect(rounds).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4])
    const s = store.getState()
    expect(s.phase).toBe('runEnd')
    expect(s.won).toBe(true)
  })

  it('missing the target ends the run as a loss on any blind', () => {
    const store = createRunStore()
    store.getState().newRun('endgame')
    store.setState({ blindScore: -100000, handsLeft: 1 }) // force the miss
    playHand(store)
    const s = store.getState()
    expect(s.phase).toBe('runEnd')
    expect(s.won).toBe(false)
    expect(s.blindIndex).toBe(0)
  })

  it('same seed + same choices → same hands (reproducibility)', () => {
    const a = createRunStore()
    const b = createRunStore()
    a.getState().newRun('same-seed')
    b.getState().newRun('same-seed')
    const hands: string[] = []
    for (let i = 0; i < 3; i++) {
      for (let slot = 0; slot < 5; slot++) {
        a.getState().tossSlot(slot)
        b.getState().tossSlot(slot)
      }
      hands.push(
        a.getState().hand.map((s) => s?.face ?? '.').join(''),
        b.getState().hand.map((s) => s?.face ?? '.').join(''),
      )
      a.getState().score()
      b.getState().score()
    }
    expect(hands[0]).toBe(hands[1])
    expect(hands[2]).toBe(hands[3])
    expect(hands[4]).toBe(hands[5])
  })

  it('tossSlot is a no-op on a filled slot or while the toss window is open', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    store.getState().tossSlot(0)
    const first = store.getState().hand[0]
    store.getState().tossSlot(0)
    expect(store.getState().hand[0]).toEqual(first)
    expect(store.getState().deck.drawPile).toHaveLength(BASE_DECK_SIZE - 1)
    for (let slot = 1; slot < 5; slot++) store.getState().tossSlot(slot)
    const full = store.getState().hand
    store.getState().tossSlot(0)
    expect(store.getState().hand).toEqual(full)
  })

  it('score is a no-op unless the toss window is open', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    store.getState().score()
    expect(store.getState().lastScore).toBeNull()
    expect(store.getState().handsLeft).toBe(HANDS_PER_BLIND)
  })

  it('toMenu discards the run', () => {
    const store = createRunStore()
    store.getState().newRun('test123')
    store.getState().tossSlot(0)
    store.getState().toMenu()
    const s = store.getState()
    expect(s.phase).toBe('menu')
    expect(s.seed).toBe('')
    expect(s.hand).toEqual([null, null, null, null, null])
    expect(s.deck.drawPile).toHaveLength(0)
    expect(s.handsLeft).toBe(HANDS_PER_BLIND)
  })
})
