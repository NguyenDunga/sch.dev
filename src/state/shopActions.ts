// C8 — Shop actions (M9) + blind progression (M10) + charm reorder (M8).
//
// Shop phase: buy / reroll / mergeCoin / removeCoin over the generated offers;
// leaveShop advances to the next blind. moveCharm works in run + shop (the
// charm-bar order is the scoring order). Action bodies are module-level
// functions (≤60 lines, NASA practice); the store wires them up.

import {
  BLINDS,
  CHARMS,
  COIN_EFFECTS,
  HANDS_PER_BLIND,
  HAND_SIZE_CAP,
  HAND_SIZE_PRICE,
  PLAY_SIZE,
  REMOVE_COIN_COST,
  SHOP_SLOTS,
  SHORT_FUSE_HANDS,
} from '@/core/balance'
import { shuffleCollection } from '@/core/deck'
import { emptyHand } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import type { Coin, CoinEffect, CoinEffectId, RunState, ShopOffer } from '@/core/types'
import type { Draft } from './storeTypes'

// -- offer generation (M9.1) ------------------------------------------------------

/**
 * M9.1: draw SHOP_SLOTS offers from the combined pool — unowned charms + all
 * coin effects (coins may be offered repeatedly across shops) + the hand-size
 * upgrade (while under the cap). Sampled without replacement (Fisher–Yates),
 * so no offer duplicates within one shop and no owned charm is ever offered.
 * The pool is always ≥ 5 (11 coin entries alone), so the shop always fills.
 */
export function generateOffers(rng: Rng, charms: RunState['charms'], handSize: number): ShopOffer[] {
  const pool: ShopOffer[] = [
    ...CHARMS.filter((c) => !charms.includes(c.id)).map(
      (c): ShopOffer => ({ kind: 'charm', charm: c.id }),
    ),
    ...COIN_EFFECTS.map((c): ShopOffer => ({ kind: 'coin', effect: c.effect })),
  ]
  if (handSize < HAND_SIZE_CAP) pool.push({ kind: 'handSize' })
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, SHOP_SLOTS)
}

/** Two offers are the same item (structural — the immer draft wraps references). */
function sameOffer(a: ShopOffer, b: ShopOffer): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'handSize' || b.kind === 'handSize') return a.kind === b.kind
  if (a.kind === 'charm' && b.kind === 'charm') return a.charm === b.charm
  return a.kind === 'coin' && b.kind === 'coin' && a.effect === b.effect
}

/** The next free coin id (collection ids are unique: base 0..size-1, purchases append). */
function nextCoinId(deck: RunState['deck']): number {
  return Math.max(...[...deck.drawPile, ...deck.discardPile].map((c) => c.id)) + 1
}

/** A catalog id → the purchased coin's effect variant (M9.4): Weight/Double-Side
 *  roll their favoured face via the rng; Draw-N → { kind: 'draw', count: N }. */
function purchasedEffect(effectId: CoinEffectId, rng: Rng): CoinEffect {
  switch (effectId) {
    case 'weight':
    case 'doubleSide':
      return { kind: effectId, favored: rng.next() < 0.5 ? 'H' : 'T' }
    case 'draw1':
      return { kind: 'draw', count: 1 }
    case 'draw2':
      return { kind: 'draw', count: 2 }
    case 'draw3':
      return { kind: 'draw', count: 3 }
    default:
      return { kind: effectId }
  }
}

// -- shop actions -------------------------------------------------------------------

export function mergeCoinDraft(st: Draft, fromId: number, toId: number): void {
  if (st.phase !== 'shop') return
  if (fromId === toId) return
  const collection = [...st.deck.drawPile, ...st.deck.discardPile]
  const from = collection.find((c) => c.id === fromId)
  const to = collection.find((c) => c.id === toId)
  if (!from || !to) return
  // Target gains all of the source's effects (stack freely, no cap);
  // the source is removed from the collection. Free.
  to.effects = [...to.effects, ...from.effects]
  st.deck.drawPile = st.deck.drawPile.filter((c) => c.id !== fromId)
  st.deck.discardPile = st.deck.discardPile.filter((c) => c.id !== fromId)
}

export function moveCharmDraft(st: Draft, from: number, to: number): void {
  if (st.phase !== 'run' && st.phase !== 'shop') return
  if (from === to || from < 0 || to < 0 || from >= st.charms.length || to >= st.charms.length)
    return
  const charms = [...st.charms]
  const [moved] = charms.splice(from, 1)
  charms.splice(to, 0, moved)
  st.charms = charms
}

export function rerollDraft(st: Draft, rng: Rng): void {
  if (st.phase !== 'shop' || st.shop.rerollUsed) return
  st.shop.offers = generateOffers(rng, st.charms, st.handSize)
  st.shop.rerollUsed = true
  st.rngState = rng.state()
}

export function buyDraft(st: Draft, offer: ShopOffer, rng: Rng): void {
  if (st.phase !== 'shop') return
  const price =
    offer.kind === 'charm'
      ? CHARMS.find((c) => c.id === offer.charm)?.price
      : offer.kind === 'coin'
        ? COIN_EFFECTS.find((c) => c.effect === offer.effect)?.price
        : HAND_SIZE_PRICE
  if (price === undefined || st.cash < price) return // broke — reject
  if (offer.kind === 'charm' && st.charms.includes(offer.charm)) return // owned — reject (9.8)
  if (offer.kind === 'handSize' && st.handSize >= HAND_SIZE_CAP) return // cap — reject (9.7)
  st.cash -= price
  if (offer.kind === 'charm') {
    st.charms.push(offer.charm)
  } else if (offer.kind === 'coin') {
    // M9.4: new coin joins the collection (draw pile) with its effect variant;
    // Weight/Double-Side roll their favoured face now, fixed for the run.
    const coin: Coin = { id: nextCoinId(st.deck), effects: [purchasedEffect(offer.effect, rng)] }
    st.deck.drawPile = [...st.deck.drawPile, coin]
    st.rngState = rng.state()
  } else {
    // M9.7: hand-size upgrade — +1 slot, up to HAND_SIZE_CAP.
    st.handSize += 1
  }
  // Remove the bought offer (structurally — the draft wraps the passed object).
  st.shop.offers = st.shop.offers.filter((o) => !sameOffer(o, offer))
}

export function removeCoinDraft(st: Draft, id: number): void {
  if (st.phase !== 'shop') return
  if (st.cash < REMOVE_COIN_COST) return // broke — reject
  const inDraw = st.deck.drawPile.some((c) => c.id === id)
  const inDiscard = st.deck.discardPile.some((c) => c.id === id)
  if (!inDraw && !inDiscard) return // unknown coin — no-op
  st.deck.drawPile = st.deck.drawPile.filter((c) => c.id !== id)
  st.deck.discardPile = st.deck.discardPile.filter((c) => c.id !== id)
  st.cash -= REMOVE_COIN_COST
}

// -- blind progression (M10.3) ---------------------------------------------------------

export function leaveShopDraft(st: Draft, rng: Rng): void {
  if (st.phase !== 'shop') return
  st.blindIndex += 1
  const next = BLINDS[st.blindIndex]
  st.round = next.round
  const baseHands =
    next.kind === 'boss' && next.rule === 'shortFuse' ? SHORT_FUSE_HANDS : HANDS_PER_BLIND
  st.handsLeft = baseHands + (st.charms.includes('extraHand') ? 1 : 0)
  st.blindScore = 0
  st.earlyClearBonus = 0
  // 13a.2 keep-unplayed: the hand may still hold unplayed coins from the
  // last hand — they are part of the collection and go back into it.
  const inHand = st.hand.filter((s) => s.kind === 'filled').map((s) => s.coin)
  st.hand = emptyHand(st.handSize)
  st.play = emptyHand(PLAY_SIZE)
  // Whole collection (draw + discard + kept hand coins) → shuffled draw pile;
  // discard cleared.
  st.deck = shuffleCollection(rng, { drawPile: [...st.deck.drawPile, ...inHand], discardPile: st.deck.discardPile })
  st.shop = { offers: [], rerollUsed: false }
  st.rngState = rng.state()
  st.phase = 'run'
  st.handPhase = 'draw'
}
