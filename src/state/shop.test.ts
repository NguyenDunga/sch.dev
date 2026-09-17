// M9 — Shop (shopActions via runStore).
//
// M9.1 offer generation, M9.2 one free reroll, M9.3 buy a charm, M9.4 buy a
// coin (favoured-face roll), M9.6 removeCoin ($1 delete), M9.7 hand-size
// upgrade (cap).

import { describe, expect, it } from 'vitest'
import { CHARMS, COIN_EFFECTS, HAND_SIZE_CAP, HAND_SIZE_PRICE, SHOP_SLOTS } from '@/core/balance'
import { createRunStore, type RunStore } from './runStore'

describe('M9.1 — shop offer generation', () => {
  /** A store that genuinely cleared blind 1 → shop (offers drawn from the rng). */
  function shopStore(seed: string, charms: RunStore['charms'] = []) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({ charms, blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    return store
  }

  it('entering the shop generates exactly 5 offers', () => {
    const store = shopStore('m9-1')
    expect(store.getState().phase).toBe('shop')
    expect(store.getState().shop.offers).toHaveLength(SHOP_SLOTS)
    expect(store.getState().shop.rerollUsed).toBe(false)
  })

  it('no owned charm is ever offered', () => {
    const store = shopStore('m9-1b', ['plusChips', 'payday'])
    for (const offer of store.getState().shop.offers) {
      if (offer.kind === 'charm') {
        expect(offer.charm).not.toBe('plusChips')
        expect(offer.charm).not.toBe('payday')
      }
    }
  })

  it('every offer comes from the pool (unowned charms + coin effects + hand-size)', () => {
    const store = shopStore('m9-1c', ['extraHand'])
    const pool = new Set([
      ...CHARMS.filter((c) => c.id !== 'extraHand').map((c) => `charm:${c.id}`),
      ...COIN_EFFECTS.map((c) => `coin:${c.effect}`),
      'handSize',
    ])
    for (const offer of store.getState().shop.offers) {
      const key =
        offer.kind === 'charm'
          ? `charm:${offer.charm}`
          : offer.kind === 'coin'
            ? `coin:${offer.effect}`
            : 'handSize'
      expect(pool.has(key)).toBe(true)
    }
  })

  it('same seed → identical offers (deterministic draw)', () => {
    const a = shopStore('m9-1d').getState().shop.offers
    const b = shopStore('m9-1d').getState().shop.offers
    expect(a).toEqual(b)
  })

  it('no hand-size offer at the cap', () => {
    const store = createRunStore()
    store.getState().startRun('m9-1e')
    store.setState({ handSize: HAND_SIZE_CAP, blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    expect(
      store
        .getState()
        .shop.offers.some((o) => o.kind === 'handSize'),
    ).toBe(false)
  })
})

describe('M9.2 — reroll (one free per shop)', () => {
  function shopStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({ blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    return store
  }

  it('reroll regenerates all 5 offers and sets rerollUsed', () => {
    const store = shopStore('m9-2')
    const before = store.getState().shop
    expect(before.rerollUsed).toBe(false)

    store.getState().reroll()
    const after = store.getState().shop
    expect(after.rerollUsed).toBe(true)
    expect(after.offers).toHaveLength(SHOP_SLOTS)
    expect(after.offers).not.toEqual(before.offers) // regenerated, not kept
  })

  it('9.8 the second reroll is a no-op (offers and rng state unchanged)', () => {
    const store = shopStore('m9-2b')
    store.getState().reroll()
    const once = store.getState()
    const rngOnce = [...once.rngState]
    const offersOnce = [...once.shop.offers]

    store.getState().reroll()
    const twice = store.getState()
    expect(twice.shop.offers).toEqual(offersOnce)
    expect(twice.rngState).toEqual(rngOnce) // no rng consumed
  })

  it('reroll out of the shop phase is a no-op', () => {
    const store = shopStore('m9-2c')
    store.setState({ phase: 'run' })
    const before = store.getState()
    store.getState().reroll()
    expect(store.getState().shop).toEqual(before.shop)
  })
})

describe('M9.3 — buy (charm) + rejections', () => {
  function shopStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash: 10,
      shop: {
        offers: [
          { kind: 'charm', charm: 'plusChips' },
          { kind: 'coin', effect: 'tax' },
          { kind: 'handSize' },
          { kind: 'charm', charm: 'payday' },
          { kind: 'coin', effect: 'draw1' },
        ],
        rerollUsed: false,
      },
    })
    return store
  }

  it('buy a charm: cash -= price, charm added, offer removed', () => {
    const store = shopStore('m9-3')
    store.getState().buy({ kind: 'charm', charm: 'plusChips' })
    const st = store.getState()

    expect(st.cash).toBe(10 - 5) // plusChips price
    expect(st.charms).toEqual(['plusChips'])
    expect(st.shop.offers).toHaveLength(4)
    expect(st.shop.offers.some((o) => o.kind === 'charm' && o.charm === 'plusChips')).toBe(false)
  })

  it('reject when broke: state unchanged', () => {
    const store = shopStore('m9-3b')
    store.setState({ cash: 4 }) // plusChips costs 5
    const before = store.getState()

    store.getState().buy({ kind: 'charm', charm: 'plusChips' })
    expect(store.getState()).toEqual(before)
  })

  it('9.8 reject an already-owned charm: state unchanged', () => {
    const store = shopStore('m9-3c')
    store.setState({ charms: ['plusChips'] })
    const before = store.getState()

    store.getState().buy({ kind: 'charm', charm: 'plusChips' })
    expect(store.getState()).toEqual(before)
  })

  it('buy out of the shop phase is a no-op', () => {
    const store = shopStore('m9-3d')
    store.setState({ phase: 'run' })
    const before = store.getState()

    store.getState().buy({ kind: 'charm', charm: 'plusChips' })
    expect(store.getState()).toEqual(before)
  })
})

describe('M9.4 — buy a coin (favoured-face roll + collection add)', () => {
  function shopStore(seed: string, effect: 'weight' | 'heads' | 'tails' | 'facedown' | 'draw2' | 'tax') {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash: 20,
      shop: { offers: [{ kind: 'coin', effect }], rerollUsed: false },
    })
    return store
  }

  it('buy a Weight coin: rolls its favoured face via the rng and adds it to the collection', () => {
    const buyWeight = (seed: string) => {
      const store = shopStore(seed, 'weight')
      const sizeBefore = store.getState().deck.drawPile.length
      store.getState().buy({ kind: 'coin', effect: 'weight' })
      const st = store.getState()
      const bought = st.deck.drawPile[sizeBefore]
      return { cash: st.cash, bought, ids: st.deck.drawPile.map((c) => c.id) }
    }

    const a = buyWeight('m9-4')
    expect(a.cash).toBe(20 - 5) // Weight price
    expect(a.bought.effects).toHaveLength(1)
    expect(a.bought.effects[0].kind).toBe('weight')
    if (a.bought.effects[0].kind === 'weight') {
      expect(['H', 'T']).toContain(a.bought.effects[0].favored)
    }
    // unique id (max + 1), no duplicates
    expect(new Set(a.ids).size).toBe(a.ids.length)

    // same seed → same rolled face (deterministic)
    expect(buyWeight('m9-4').bought).toEqual(a.bought)
  })

  it('buy a Heads/Tails/Face-Down coin: fixed face effect (no roll)', () => {
    const buyFixed = (effect: 'heads' | 'tails' | 'facedown') => {
      const store = shopStore('m9-4b-' + effect, effect)
      store.getState().buy({ kind: 'coin', effect })
      return store.getState().deck.drawPile.at(-1)
    }
    expect(buyFixed('heads')?.effects).toEqual([{ kind: 'heads' }])
    expect(buyFixed('tails')?.effects).toEqual([{ kind: 'tails' }])
    expect(buyFixed('facedown')?.effects).toEqual([{ kind: 'facedown' }])
  })

  it('buy a Draw-2 coin: the effect variant carries count 2', () => {
    const store = shopStore('m9-4c', 'draw2')
    store.getState().buy({ kind: 'coin', effect: 'draw2' })
    expect(store.getState().deck.drawPile.at(-1)?.effects).toEqual([{ kind: 'draw', count: 2 }])
  })

  it('buy a plain-effect coin (Tax): the unit variant, no params', () => {
    const store = shopStore('m9-4d', 'tax')
    store.getState().buy({ kind: 'coin', effect: 'tax' })
    expect(store.getState().deck.drawPile.at(-1)?.effects).toEqual([{ kind: 'tax' }])
  })

  it('the bought offer is removed and cash deducted', () => {
    const store = shopStore('m9-4e', 'tax')
    store.getState().buy({ kind: 'coin', effect: 'tax' })
    const st = store.getState()
    expect(st.shop.offers).toHaveLength(0)
    expect(st.cash).toBe(20 - 5)
  })
})

describe('M9.6 — removeCoin ($1 delete, no refund)', () => {
  function shopStore(seed: string, cash: number) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash,
      deck: {
        drawPile: [{ id: 900, effects: [{ kind: 'tax' }] }, ...store.getState().deck.drawPile],
        discardPile: [{ id: 901, effects: [] }],
      },
    })
    return store
  }

  it('9.9 removing a coin costs $1 and deletes it (draw pile)', () => {
    const store = shopStore('m9-6', 5)
    store.getState().removeCoin(900)
    const st = store.getState()
    expect(st.cash).toBe(4)
    expect(st.deck.drawPile.some((c) => c.id === 900)).toBe(false)
  })

  it('9.9 removing a coin from the discard pile works too; delete only, never a refund', () => {
    const store = shopStore('m9-6b', 5)
    store.getState().removeCoin(901)
    const st = store.getState()
    expect(st.cash).toBe(4) // cash goes down, never up
    expect(st.deck.discardPile.some((c) => c.id === 901)).toBe(false)
  })

  it('9.9 no "sell charm" action exists — charms can only be bought, never sold', () => {
    const store = shopStore('m9-6c', 5)
    expect('sellCharm' in store.getState()).toBe(false)
    expect('removeCharm' in store.getState()).toBe(false)
  })

  it('no-ops: broke, unknown id, wrong phase', () => {
    const store = shopStore('m9-6d', 0)
    const before = store.getState()

    store.getState().removeCoin(900) // broke
    expect(store.getState()).toEqual(before)

    store.setState({ cash: 5 })
    store.getState().removeCoin(4242) // unknown
    expect(store.getState().cash).toBe(5)

    store.setState({ phase: 'run' })
    store.getState().removeCoin(900)
    expect(store.getState().cash).toBe(5)
  })
})

describe('M9.7 — hand-size upgrade', () => {
  function shopStore(seed: string, handSize: number, cash: number) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      handSize,
      cash,
      shop: { offers: [{ kind: 'handSize' }], rerollUsed: false },
    })
    return store
  }

  it('buy: handSize +1, cash -= HAND_SIZE_PRICE, offer removed', () => {
    const store = shopStore('m9-7', 8, 20)
    store.getState().buy({ kind: 'handSize' })
    const st = store.getState()
    expect(st.handSize).toBe(9)
    expect(st.cash).toBe(20 - HAND_SIZE_PRICE)
    expect(st.shop.offers).toHaveLength(0)
  })

  it('past the cap: rejected, state unchanged', () => {
    const store = shopStore('m9-7b', HAND_SIZE_CAP, 20)
    const before = store.getState()
    store.getState().buy({ kind: 'handSize' })
    expect(store.getState()).toEqual(before)
  })
})

