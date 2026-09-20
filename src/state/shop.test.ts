// M9 — Shop (shopActions via runStore).
//
// M9.1 offer generation, 13a.15 unlimited rerolls (escalating, per-round),
// M9.3 buy a charm, M9.4 buy a coin (favoured-face roll), 13a.14 sellCoin
// (Recycler), M9.7 hand-size upgrade (cap).

import { describe, expect, it } from 'vitest'
import { HAND_SIZE_CAP, HAND_SIZE_PRICE, SHOP_SLOTS } from '@/core/shop'
import { TIERS, TIER_UPGRADE_CHIPS, TIER_UPGRADE_MULT, TIER_UPGRADE_PRICE } from '@/core/balance'
import { COIN_CATALOG } from '@/config/coins'
import { CHARM_CATALOG } from '@/config/charms'
import { createRunStore, type RunStore } from './runStore'
import { generateOffers, sameOffer } from './shop'
import { createRng } from '@/core/rng'
import type { ShopOffer } from '@/core/types'

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
    store.getState().finishScore()
    return store
  }

  it('entering the shop generates exactly 5 offers', () => {
    const store = shopStore('m9-1')
    expect(store.getState().phase).toBe('shop')
    expect(store.getState().shop.offers).toHaveLength(SHOP_SLOTS)
    expect(store.getState().rerollCount).toBe(0)
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

  it('every offer comes from the pool (unowned charms + coin effects + hand-size + tier upgrades)', () => {
    const store = shopStore('m9-1c', ['extraHand'])
    const pool = new Set([
      ...CHARM_CATALOG.filter((c) => c.id !== 'extraHand').map((c) => `charm:${c.id}`),
      ...COIN_CATALOG.map((c) => `coin:${c.effect}`),
      'handSize',
      ...TIERS.flatMap((t) => [`tierUpgrade:${t.id}:chips`, `tierUpgrade:${t.id}:mult`]),
    ])
    for (const offer of store.getState().shop.offers) {
      const key =
        offer.kind === 'charm'
          ? `charm:${offer.charm}`
          : offer.kind === 'coin'
            ? `coin:${offer.effect}`
            : offer.kind === 'tierUpgrade'
              ? `tierUpgrade:${offer.upgrade.tier}:${offer.upgrade.stat}`
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

describe('M9.2 — reroll (13a.15: unlimited, $1 more each, per round)', () => {
  function shopStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({ blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
    return store
  }

  it('13a.15 reroll regenerates all 5 offers, charges $1, and bumps the counter', () => {
    const store = shopStore('m9-2')
    const before = store.getState()
    expect(before.rerollCount).toBe(0)

    store.getState().reroll()
    const after = store.getState()
    expect(after.rerollCount).toBe(1)
    expect(after.cash).toBe(before.cash - 1)
    expect(after.shop.offers).toHaveLength(SHOP_SLOTS)
    expect(after.shop.offers).not.toEqual(before.shop.offers) // regenerated, not kept
  })

  it('13a.15 each reroll costs $1 more than the previous one', () => {
    const store = shopStore('m9-2b')
    const cash0 = store.getState().cash
    store.getState().reroll()
    expect(store.getState().cash).toBe(cash0 - 1) // 1st: $1
    store.getState().reroll()
    expect(store.getState().cash).toBe(cash0 - 3) // 2nd: $2
    store.getState().reroll()
    expect(store.getState().cash).toBe(cash0 - 6) // 3rd: $3
    expect(store.getState().rerollCount).toBe(3)
  })

  it('13a.15 a reroll is a no-op when broke (offers and rng unchanged)', () => {
    const store = shopStore('m9-2b')
    store.setState({ cash: 0 })
    const before = store.getState()
    store.getState().reroll()
    expect(store.getState().shop.offers).toEqual(before.shop.offers)
    expect(store.getState().rngState).toEqual(before.rngState) // no rng consumed
    expect(store.getState().rerollCount).toBe(0)
  })

  it('13a.15 the counter persists across a round and resets after the boss blind', () => {
    const store = shopStore('m9-2c') // the round-1 small's shop
    store.getState().reroll()
    store.getState().reroll()
    expect(store.getState().rerollCount).toBe(2)

    // Clear the big blind → its shop: the counter persists.
    store.getState().leaveShop()
    clearBlind(store)
    expect(store.getState().phase).toBe('shop')
    expect(store.getState().rerollCount).toBe(2)

    // Clear the boss blind → the round-2 shop: the counter resets.
    store.getState().leaveShop()
    clearBlind(store)
    expect(store.getState().phase).toBe('shop')
    expect(store.getState().rerollCount).toBe(0)
  })

  /** Clears the current blind (real flow) → the next shop. */
  function clearBlind(store: ReturnType<typeof createRunStore>) {
    store.setState({ blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    store.getState().finishScore()
  }

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
  function shopStore(seed: string, effect: 'weight' | 'heads' | 'tails' | 'draw2' | 'tax') {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash: 20,
      shop: { offers: [{ kind: 'coin', effect }] },
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

  it('buy a Heads/Tails coin: fixed face effect (no roll)', () => {
    const buyFixed = (effect: 'heads' | 'tails') => {
      const store = shopStore('m9-4b-' + effect, effect)
      store.getState().buy({ kind: 'coin', effect })
      return store.getState().deck.drawPile.at(-1)
    }
    expect(buyFixed('heads')?.effects).toEqual([{ kind: 'heads' }])
    expect(buyFixed('tails')?.effects).toEqual([{ kind: 'tails' }])
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

describe('13a.14 — sellCoin (Recycler: sell for money)', () => {
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

  it('selling a coin removes it and pays its recycle price ($1 per effect)', () => {
    const store = shopStore('sell-1', 5)
    store.getState().sellCoin(900) // 1 effect → $1
    const st = store.getState()
    expect(st.cash).toBe(6)
    expect(st.deck.drawPile.some((c) => c.id === 900)).toBe(false)
  })

  it('a plain coin sells for the $1 minimum (discard pile works too)', () => {
    const store = shopStore('sell-2', 5)
    store.getState().sellCoin(901) // plain → $1 minimum
    const st = store.getState()
    expect(st.cash).toBe(6)
    expect(st.deck.discardPile.some((c) => c.id === 901)).toBe(false)
  })

  it('multi-effect coins sell for $1 per effect', () => {
    const store = shopStore('sell-3', 0)
    store.setState((s) => ({
      deck: {
        drawPile: [
          { id: 902, effects: [{ kind: 'tax' }, { kind: 'echo' }] },
          ...s.deck.drawPile,
        ],
        discardPile: s.deck.discardPile,
      },
    }))
    store.getState().sellCoin(902) // 2 effects → $2
    expect(store.getState().cash).toBe(2)
  })

  it('no "sell charm" action exists — charms can only be bought, never sold', () => {
    const store = shopStore('sell-4', 5)
    expect('sellCharm' in store.getState()).toBe(false)
    expect('removeCharm' in store.getState()).toBe(false)
  })

  it('no-ops: unknown id, wrong phase', () => {
    const store = shopStore('sell-5', 5)
    const before = store.getState()
    store.getState().sellCoin(4242) // unknown
    expect(store.getState()).toEqual(before)

    store.setState({ phase: 'run' })
    store.getState().sellCoin(900)
    expect(store.getState().cash).toBe(5)
  })
})

describe('13a.16 — coin-id uniqueness (player report: stuck on duplicate ids)', () => {
  /** A shop store whose HAND still holds the max-id coin (keep-unplayed,
   *  13a.2) — the exact collision setup: the pile-only id scan sees a lower
   *  max and hands the purchase the hand coin's id. */
  function handHoldsMaxIdStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState((s) => ({
      phase: 'shop',
      cash: 20,
      shop: { offers: [{ kind: 'coin', effect: 'tax' }] },
      hand: s.hand.map((slot, i) =>
        i === 0 ? { kind: 'filled', coin: { id: 23, effects: [] }, face: 'H', echoUsed: false } : slot,
      ),
      deck: { drawPile: s.deck.drawPile.filter((c) => c.id !== 23), discardPile: [] },
    }))
    return store
  }

  /** A shop store whose collection already holds a duplicate pair (id 23)
   *  — the legacy damage a pre-fix save could carry. */
  function legacyDupStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState((s) => ({
      phase: 'shop',
      cash: 20,
      deck: {
        drawPile: [...s.deck.drawPile, { id: 23, effects: [] }], // twin of the base 23
        discardPile: s.deck.discardPile,
      },
    }))
    return store
  }

  const allIds = (st: { deck: { drawPile: { id: number }[]; discardPile: { id: number }[] }; hand: { kind: string; coin?: { id: number } }[]; play: { kind: string; coin?: { id: number } }[] }) => [
    ...st.deck.drawPile,
    ...st.deck.discardPile,
    ...st.hand.filter((s) => s.kind === 'filled').map((s) => s.coin!),
    ...st.play.filter((s) => s.kind === 'filled').map((s) => s.coin!),
  ]

  it('buying a coin while the hand holds the max-id coin gets a fresh id (no collision)', () => {
    const store = handHoldsMaxIdStore('dup-buy')
    store.getState().buy({ kind: 'coin', effect: 'tax' })
    const st = store.getState()
    const ids = allIds(st).map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length) // unique
    expect(st.deck.drawPile.at(-1)?.id).toBe(24) // max(23 in hand) + 1, not max(piles) + 1 = 22
  })

  it('selling a coin whose id is duplicated removes only one copy (legacy-save safety)', () => {
    const store = legacyDupStore('dup-sell')
    const before = allIds(store.getState()).length
    store.getState().sellCoin(23)
    const st = store.getState()
    expect(allIds(st).length).toBe(before - 1) // exactly one copy gone
    expect(allIds(st).filter((c) => c.id === 23)).toHaveLength(1)
  })

  it('forging away a coin whose id is duplicated consumes only the source copy (legacy-save safety)', () => {
    const store = legacyDupStore('dup-forge')
    const before = allIds(store.getState()).length
    store.getState().mergeCoin(23, 22) // forge one of the 23s into coin 22
    const st = store.getState()
    expect(allIds(st).length).toBe(before - 1) // the source consumed, the twin kept
    expect(allIds(st).filter((c) => c.id === 23)).toHaveLength(1)
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
      shop: { offers: [{ kind: 'handSize' }] },
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

describe('M22 — pattern (tier) upgrades', () => {
  it('generateOffers: all 12 tier upgrades (6 tiers × chips/mult) are in the pool', () => {
    // Every seed draws 5 of the 30-entry pool; across seeds each of the 12
    // tier upgrades must be offerable (and none may duplicate in one shop).
    const seen = new Set<string>()
    for (let i = 0; i < 40; i++) {
      const offers = generateOffers(createRng(`m22-${i}`), [], 8)
      expect(offers).toHaveLength(SHOP_SLOTS)
      const keys = offers.map((o) =>
        o.kind === 'tierUpgrade' ? `tierUpgrade:${o.upgrade.tier}:${o.upgrade.stat}` : JSON.stringify(o),
      )
      expect(new Set(keys).size).toBe(keys.length) // no duplicates in one shop
      for (const o of offers) if (o.kind === 'tierUpgrade') seen.add(`${o.upgrade.tier}:${o.upgrade.stat}`)
    }
    expect(seen.size).toBe(12)
    for (const t of TIERS) {
      expect(seen.has(`${t.id}:chips`)).toBe(true)
      expect(seen.has(`${t.id}:mult`)).toBe(true)
    }
  })

  it('sameOffer: the tierUpgrade variant matches on tier AND stat', () => {
    const a: ShopOffer = { kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } }
    expect(sameOffer(a, { kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })).toBe(true)
    expect(sameOffer(a, { kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'mult' } })).toBe(false)
    expect(sameOffer(a, { kind: 'tierUpgrade', upgrade: { tier: 'alternating', stat: 'chips' } })).toBe(false)
    expect(sameOffer(a, { kind: 'charm', charm: 'plusChips' })).toBe(false)
  })

  function shopStore(seed: string) {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash: 20,
      shop: {
        offers: [
          { kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } },
          { kind: 'tierUpgrade', upgrade: { tier: 'alternating', stat: 'mult' } },
        ],
      },
    })
    return store
  }

  it('buy a +chips upgrade: cash -= TIER_UPGRADE_PRICE, the tier stacks', () => {
    const store = shopStore('m22-buy')
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })
    const st = store.getState()
    expect(st.cash).toBe(20 - TIER_UPGRADE_PRICE)
    expect(st.tierUpgrades.jackpot).toEqual({ chips: TIER_UPGRADE_CHIPS, mult: 0 })
    // the other tiers are untouched; the bought offer is removed
    expect(st.tierUpgrades.alternating).toEqual({ chips: 0, mult: 0 })
    expect(st.shop.offers).toHaveLength(1)
  })

  it('buy a +mult upgrade: the tier mult stacks', () => {
    const store = shopStore('m22-buy-mult')
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'alternating', stat: 'mult' } })
    expect(store.getState().tierUpgrades.alternating).toEqual({ chips: 0, mult: TIER_UPGRADE_MULT })
  })

  it('buying the same tier again stacks (no owned/cap reject)', () => {
    const store = shopStore('m22-stack')
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })
    // re-offer the same upgrade and buy it again
    store.setState({ shop: { offers: [{ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } }] } })
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })
    expect(store.getState().tierUpgrades.jackpot.chips).toBe(TIER_UPGRADE_CHIPS * 2)
  })

  it('reject when broke: state unchanged', () => {
    const store = shopStore('m22-broke')
    store.setState({ cash: TIER_UPGRADE_PRICE - 1 })
    const before = store.getState()
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })
    expect(store.getState()).toEqual(before)
  })

  it('upgrades persist across blinds and shops (whole run, like charms)', () => {
    const store = shopStore('m22-persist')
    store.getState().buy({ kind: 'tierUpgrade', upgrade: { tier: 'jackpot', stat: 'chips' } })
    store.getState().leaveShop()
    // the next blind's shop keeps the purchase
    expect(store.getState().phase).toBe('run')
    expect(store.getState().tierUpgrades.jackpot.chips).toBe(TIER_UPGRADE_CHIPS)
  })
})

