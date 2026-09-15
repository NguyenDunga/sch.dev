// M11 — Save / resume (saveActions via runStore) + the 100%-coverage edges.
//
// M11.1 explicit save, M11.2 resume no-op guards, M11.3 resume in run (blind
// start), M11.4 resume in shop (same offers), M11.5 round-trip, M11.6 no
// autosave. The node test env has no localStorage — stub it per suite.

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { BASE_DECK_SIZE, HANDS_PER_BLIND, HAND_SIZE, SHOP_SLOTS, SHORT_FUSE_HANDS } from '@/core/balance'
import { filledSlot, none } from '@/core/helpers'
import { createRunStore } from './runStore'
import { makeLocalStorage } from './testHelpers'

describe('M11.1 — save()', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  it('writes { version: 2, state } to the fifty-fifty-run key (incl. rngState + collection)', () => {
    const store = createRunStore()
    store.getState().startRun('m11-1')
    store.getState().drawHand()
    store.getState().save()

    const raw = localStorage.getItem('fifty-fifty-run')
    expect(raw).not.toBeNull()
    const saved = JSON.parse(raw as string)
    expect(saved.version).toBe(2)
    expect(saved.state.seed).toBe('m11-1')
    expect(saved.state.phase).toBe('run')
    expect(saved.state.rngState).toEqual(store.getState().rngState)
    expect(saved.state.deck).toEqual(store.getState().deck)
    expect(saved.state.charms).toEqual(store.getState().charms)
  })

  it('is explicit-only: no save on startRun or hand flow', () => {
    const setItem = vi.spyOn(localStorage, 'setItem')
    const store = createRunStore()
    store.getState().startRun('m11-1b')
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    expect(setItem).not.toHaveBeenCalled()
  })

  it('no-op in the menu (nothing to save)', () => {
    const setItem = vi.spyOn(localStorage, 'setItem')
    const store = createRunStore()
    store.getState().save()
    expect(setItem).not.toHaveBeenCalled()
  })
})

describe('M11.2 — resume() restore + no-op guards', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  it('no save present: no-op (state unchanged)', () => {
    localStorage.clear()
    const store = createRunStore()
    const before = store.getState()
    store.getState().resume()
    expect(store.getState()).toEqual(before)
  })

  it('unparseable save: no-op', () => {
    localStorage.setItem('fifty-fifty-run', '{not json')
    const store = createRunStore()
    const before = store.getState()
    store.getState().resume()
    expect(store.getState()).toEqual(before)
  })

  it('v1 save: discarded (not migratable), no-op', () => {
    localStorage.setItem('fifty-fifty-run', JSON.stringify({ version: 1, state: { seed: 'old' } }))
    const store = createRunStore()
    const before = store.getState()
    store.getState().resume()
    expect(store.getState()).toEqual(before)
  })

  it('valid v2 save: restores the preserved fields (seed, cash, charms, collection, rngState, phase)', () => {
    const a = createRunStore()
    a.getState().startRun('m11-2')
    a.getState().drawHand()
    a.setState({ cash: 21, charms: ['plusChips', 'payday'] })
    a.getState().save()

    const b = createRunStore()
    b.getState().resume()
    const st = b.getState()
    const saved = a.getState()
    expect(st.seed).toBe('m11-2')
    expect(st.phase).toBe('run')
    expect(st.cash).toBe(21)
    expect(st.charms).toEqual(['plusChips', 'payday'])
    // the collection is preserved (same coins); the unplayed hand coins are
    // merged back into it (13a.2); the piles are re-reshuffled at blind start (M11.3)
    const ids = (d: { drawPile: { id: number }[]; discardPile: { id: number }[] }) =>
      [...d.drawPile, ...d.discardPile].map((c) => c.id).sort((x, y) => x - y)
    const handIds = saved.hand
      .filter((s) => s.kind === 'filled')
      .map((s) => s.coin.id)
      .sort((x, y) => x - y)
    expect(ids(st.deck)).toEqual([...ids(saved.deck), ...handIds].sort((x, y) => x - y))
    // rngState continues from the saved state (the blind-start shuffle advances it — mirrored afterwards)
    expect(st.handSize).toBe(saved.handSize)
    expect(st.runScore).toBe(saved.runScore)
  })
})

describe('M11.3 — resume in run: blind-start reset', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  function savedMidBlind(seed: string, mutate?: (s: Record<string, unknown>) => void) {
    const a = createRunStore()
    a.getState().startRun(seed)
    a.getState().drawHand()
    a.getState().pickCoin(0)
    a.getState().confirmPlay()
    a.getState().score() // one hand played: coins in the discard pile, handsLeft 9
    if (mutate) a.setState(mutate)
    a.getState().save()
    return a
  }

  it('resets handsLeft/blindScore to blind start, re-reshuffles (discard cleared), preserves the rest', () => {
    savedMidBlind('m11-3', () => ({ blindScore: 150, cash: 17 }))
    const b = createRunStore()
    b.getState().resume()
    const st = b.getState()

    // blind-start resets
    expect(st.phase).toBe('run')
    expect(st.handPhase).toBe('draw')
    expect(st.blindScore).toBe(0)
    expect(st.handsLeft).toBe(HANDS_PER_BLIND) // reset to the blind's initial budget
    expect(st.lastScore).toEqual(none)
    expect(st.hand.every((s) => s.kind === 'empty')).toBe(true)
    // re-reshuffle: discard cleared, whole collection back in the draw pile
    expect(st.deck.discardPile).toHaveLength(0)
    expect(st.deck.drawPile).toHaveLength(BASE_DECK_SIZE)
    // preserved
    expect(st.seed).toBe('m11-3')
    expect(st.cash).toBe(17)
    expect(st.blindIndex).toBe(0)
  })

  it('resuming mid-Short-Fuse blind: handsLeft resets to SHORT_FUSE_HANDS', () => {
    savedMidBlind('m11-3b', () => ({ blindIndex: 5, round: 2 }))
    const b = createRunStore()
    b.getState().resume()
    expect(b.getState().handsLeft).toBe(SHORT_FUSE_HANDS)
  })

  it('Extra Hand charm: the reset budget is +1', () => {
    savedMidBlind('m11-3c', () => ({ charms: ['extraHand'] }))
    const b = createRunStore()
    b.getState().resume()
    expect(b.getState().handsLeft).toBe(HANDS_PER_BLIND + 1)
  })
})

describe('M11.4 — resume in shop: offers regenerated from rngState', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  /** Clears blind 1 (real flow) → shop, optionally rerolls, saves. */
  function saveInShop(seed: string, reroll: boolean) {
    const a = createRunStore()
    a.getState().startRun(seed)
    a.setState({ blindScore: 10_000, handsLeft: 1 })
    a.getState().drawHand()
    a.getState().pickCoin(0)
    a.getState().confirmPlay()
    a.getState().score()
    if (reroll) a.getState().reroll()
    a.getState().save()
    return a
  }

  it('lands at the shop with 5 offers, regenerated identically from the saved rngState', () => {
    saveInShop('m11-4', false)

    const b = createRunStore()
    b.getState().resume()
    const st = b.getState()
    expect(st.phase).toBe('shop')
    expect(st.shop.offers).toHaveLength(SHOP_SLOTS)

    // identical regeneration: a second fresh resume of the same save → same offers
    const c = createRunStore()
    c.getState().resume()
    expect(c.getState().shop.offers).toEqual(st.shop.offers)
  })

  it('preserves rerollUsed across resume', () => {
    saveInShop('m11-4b', true)
    const b = createRunStore()
    b.getState().resume()
    expect(b.getState().shop.rerollUsed).toBe(true)
    // and the (now spent) reroll stays spent after resume
    const offers = b.getState().shop.offers
    b.getState().reroll()
    expect(b.getState().shop.offers).toEqual(offers)
  })
})

describe('M11.5 — save → resume (fresh store) round-trip', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  it('every persisted field deep-equals the saved state', () => {
    const a = createRunStore()
    a.getState().startRun('m11-5')
    a.getState().drawHand()
    a.getState().pickCoin(0)
    a.getState().confirmPlay()
    a.getState().score()
    a.setState({ cash: 33, charms: ['plusMult', 'payday'], runScore: 42, handSize: 9 })
    a.getState().save()
    const saved = JSON.parse(localStorage.getItem('fifty-fifty-run') as string)

    const b = createRunStore()
    b.getState().resume()
    const st = b.getState()

    for (const field of ['seed', 'round', 'blindIndex', 'cash', 'charms', 'handSize', 'runScore'] as const) {
      expect(st[field]).toEqual(saved.state[field])
    }
    // collection: the same coins (the piles are re-reshuffled at blind start, so
    // compare as a set) — plus the unplayed hand coins merged back (13a.2)
    const coinIds = (d: { drawPile: { id: number }[]; discardPile: { id: number }[] }) =>
      [...d.drawPile, ...d.discardPile].map((c) => c.id).sort((x, y) => x - y)
    const savedHandIds = (saved.state.hand as Array<{ kind: string; coin?: { id: number } }>)
      .filter((s) => s.kind === 'filled')
      .map((s) => s.coin!.id)
      .sort((x, y) => x - y)
    expect(coinIds(st.deck)).toEqual([...coinIds(saved.state.deck), ...savedHandIds].sort((x, y) => x - y))
    // and the effect payloads travel with the coins
    const byId = (d: { drawPile: { id: number; effects: unknown[] }[]; discardPile: { id: number; effects: unknown[] }[] }) =>
      new Map([...d.drawPile, ...d.discardPile].map((c) => [c.id, c.effects]))
    for (const [id, effects] of byId(saved.state.deck)) {
      expect(byId(st.deck).get(id)).toEqual(effects)
    }
  })
})

describe('M11.6 — no autosave: no phase transition calls save', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  it('a full walk (hands → shop → buy/reroll/merge/remove → leaveShop → next blind) never writes to localStorage', () => {
    const setItem = vi.spyOn(localStorage, 'setItem')
    const store = createRunStore()
    store.getState().startRun('m11-6')

    // several hands
    for (let i = 0; i < 3; i++) {
      store.getState().drawHand()
      store.getState().pickCoin(0)
      store.getState().confirmPlay()
      store.getState().score()
    }
    // clear the blind → shop
    store.setState({ blindScore: 10_000, handsLeft: 1 })
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    expect(store.getState().phase).toBe('shop')

    // every shop action
    const [offer] = store.getState().shop.offers
    if (offer) store.getState().buy(offer)
    store.getState().reroll()
    store.getState().mergeCoin(0, 1)
    store.getState().removeCoin(2)
    store.getState().moveCharm(0, 0)
    // leave → next blind, play a hand there too
    store.getState().leaveShop()
    expect(store.getState().phase).toBe('run')
    store.getState().drawHand()
    store.getState().pickCoin(0)
    store.getState().confirmPlay()
    store.getState().score()
    // to the menu
    store.getState().toMenu()

    expect(setItem).not.toHaveBeenCalled()
  })
})

describe('Coverage — remaining edges (100% gate)', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  it('startRun() with no seed generates one (non-empty, run phase)', () => {
    const store = createRunStore()
    store.getState().startRun()
    const st = store.getState()
    expect(st.seed.length).toBeGreaterThan(0)
    expect(st.phase).toBe('run')
    expect(st.handPhase).toBe('draw')
  })

  function coinShopStore(seed: string, effect: 'draw1' | 'draw3' | 'weight' | 'doubleSide') {
    const store = createRunStore()
    store.getState().startRun(seed)
    store.setState({
      phase: 'shop',
      cash: 20,
      shop: { offers: [{ kind: 'coin', effect }], rerollUsed: false },
    })
    return store
  }

  it('buy a Draw-1 coin: the effect variant carries count 1', () => {
    const store = coinShopStore('cov-d1', 'draw1')
    store.getState().buy({ kind: 'coin', effect: 'draw1' })
    expect(store.getState().deck.drawPile.at(-1)?.effects).toEqual([{ kind: 'draw', count: 1 }])
  })

  it('buy a Draw-3 coin: the effect variant carries count 3', () => {
    const store = coinShopStore('cov-d3', 'draw3')
    store.getState().buy({ kind: 'coin', effect: 'draw3' })
    expect(store.getState().deck.drawPile.at(-1)?.effects).toEqual([{ kind: 'draw', count: 3 }])
  })

  it('favoured-face roll reaches both faces across seeds (H and T)', () => {
    const face = (seed: string, effect: 'weight' | 'doubleSide') => {
      const store = coinShopStore(seed, effect)
      store.getState().buy({ kind: 'coin', effect })
      const eff = store.getState().deck.drawPile.at(-1)?.effects[0]
      return eff && (eff.kind === 'weight' || eff.kind === 'doubleSide') ? eff.favored : undefined
    }
    expect(face('probe-0', 'weight')).toBe('H')
    expect(face('probe-2', 'doubleSide')).toBe('T')
  })

  it('drawHand skips non-empty hand slots (fills only the empty ones)', () => {
    const store = createRunStore()
    store.getState().startRun('cov-dh')
    const st = store.getState()
    const coin = st.deck.drawPile[0]
    if (!coin) throw new Error('test setup: empty draw pile')
    store.setState({
      hand: [filledSlot(coin, 'H'), ...st.hand.slice(1)],
    })
    store.getState().drawHand()
    const hand = store.getState().hand
    const first = hand[0]
    expect(first?.kind).toBe('filled')
    if (first?.kind === 'filled') expect(first.coin.id).toBe(coin.id) // untouched
    expect(hand.filter((s) => s.kind === 'filled').length).toBe(HAND_SIZE)
    expect(store.getState().handPhase).toBe('play')
  })

  it('unpickCoin with a full hand is a no-op (no empty slot to return to)', () => {
    const store = createRunStore()
    store.getState().startRun('cov-up')
    store.getState().drawHand()
    store.getState().pickCoin(0)
    const st = store.getState()
    const filler = st.deck.drawPile[0]
    if (!filler) throw new Error('test setup: empty draw pile')
    store.setState({
      hand: st.hand.map((s) => (s.kind === 'empty' ? filledSlot(filler, 'H') : s)),
    })
    const before = store.getState()
    store.getState().unpickCoin(0)
    expect(store.getState()).toEqual(before)
  })

  it('discard on an empty hand slot is a no-op', () => {
    const store = createRunStore()
    store.getState().startRun('cov-dc')
    store.getState().drawHand()
    const st = store.getState()
    store.setState({ hand: [st.hand[0], { kind: 'empty' }, ...st.hand.slice(2)] })
    const before = store.getState()
    store.getState().discard(1)
    expect(store.getState()).toEqual(before)
  })

  it('resume with a saved non-resumable phase (runEnd) is a no-op', () => {
    const store = createRunStore()
    store.getState().startRun('cov-rs')
    const st = store.getState()
    localStorage.setItem('fifty-fifty-run', JSON.stringify({ version: 2, state: { ...st, phase: 'runEnd' } }))
    const before = store.getState()
    store.getState().resume()
    expect(store.getState()).toEqual(before)
  })
})

describe('M11.7 — hasSave (C5: Resume visible only when a resumable save exists)', () => {
  beforeAll(() => vi.stubGlobal('localStorage', makeLocalStorage()))
  afterAll(() => vi.unstubAllGlobals())

  function writeSave(state: unknown): void {
    localStorage.setItem('fifty-fifty-run', JSON.stringify({ version: 2, state }))
  }

  it('false when no save exists', () => {
    expect(createRunStore().getState().hasSave()).toBe(false)
  })

  it('true for a valid v2 save in a resumable phase (seen by a fresh store)', () => {
    const store = createRunStore()
    store.getState().startRun('has-save')
    store.getState().drawHand()
    store.getState().save()
    expect(createRunStore().getState().hasSave()).toBe(true)
  })

  it('false for an unparseable save', () => {
    localStorage.setItem('fifty-fifty-run', 'not-json')
    expect(createRunStore().getState().hasSave()).toBe(false)
  })

  it('false for a v1 (non-migratable) save', () => {
    const store = createRunStore()
    store.getState().startRun('has-v1')
    store.getState().drawHand()
    store.getState().save()
    const state = JSON.parse(localStorage.getItem('fifty-fifty-run')!)
    localStorage.setItem('fifty-fifty-run', JSON.stringify({ version: 1, state }))
    expect(createRunStore().getState().hasSave()).toBe(false)
  })

  it('false for a saved non-resumable phase (menu) — resume would be a no-op', () => {
    const store = createRunStore()
    store.getState().startRun('has-menu')
    store.getState().drawHand()
    store.getState().save()
    const state = JSON.parse(localStorage.getItem('fifty-fifty-run')!)
    writeSave({ ...state, phase: 'menu' })
    expect(createRunStore().getState().hasSave()).toBe(false)
  })
})
