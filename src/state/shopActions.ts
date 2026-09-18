// C8 — Shop actions (M9) + blind progression (M10) + charm reorder (M8).
//
// Shop phase: buy / reroll / mergeCoin / sellCoin over the generated offers;
// leaveShop advances to the next blind. moveCharm works in run + shop (the
// charm-bar order is the scoring order). Action bodies are module-level
// functions (≤60 lines, NASA practice); the store wires them up.

import {
  BLINDS,
  HANDS_PER_BLIND,
  PLAY_SIZE,
  SHORT_FUSE_HANDS,
} from '@/core/balance'
import {
  CHARMS,
  COIN_EFFECTS,
  FORGE_COST,
  HAND_SIZE_CAP,
  HAND_SIZE_PRICE,
  recyclePrice,
  rerollCost,
  SHOP_SLOTS,
} from '@/core/shop'
import { forgeCoin } from '@/core/forge'
import { shuffleCollection } from '@/core/deck'
import { emptyHand, isFilled } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import type { Coin, CoinEffect, CoinEffectId, RunState, ShopOffer } from '@/core/types'
import type { Draft } from './storeTypes'

// -- shop entry / offer generation (M9.1, M10.2) --------------------------------

/**
 * M10.2: blind cleared (not the last one) → the shop: phase 'shop' with a
 * fresh set of offers. The reroll price counter (13a.15) resets here only
 * after a boss blind. Called from handActions.endBlind — the run flow only
 * decides *that* the blind is cleared; the shop entry itself lives here.
 */
export function enterShopDraft(st: Draft, rng: Rng): void {
  st.phase = 'shop'
  // 13a.15: the reroll price counter resets after a boss blind (a new round
  // starts) — it persists across the shops of a round.
  if (st.blindIndex % 3 === 2) st.rerollCount = 0
  st.shop = { offers: generateOffers(rng, st.charms, st.handSize) }
}

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

/** The next free coin id (collection ids are unique: base 0..size-1, purchases
 *  append). Scans the WHOLE collection — piles AND the hand/play rows:
 *  keep-unplayed (13a.2) leaves unplayed coins in the hand when the shop
 *  opens, and a pile-only scan could hand a purchase the id of a hand coin
 *  (duplicate ids loop the run screen's deal detection — player report). */
function nextCoinId(st: Draft): number {
  const all = [
    ...st.deck.drawPile,
    ...st.deck.discardPile,
    ...st.hand.filter(isFilled).map((s) => s.coin),
    ...st.play.filter(isFilled).map((s) => s.coin),
  ]
  return Math.max(...all.map((c) => c.id)) + 1
}

/** A catalog id → the purchased coin's effect variant (M9.4): Weight rolls its
 *  favoured face via the rng; Heads/Tails are fixed; Draw-N → { kind: 'draw', count: N }. */
function purchasedEffect(effectId: CoinEffectId, rng: Rng): CoinEffect {
  switch (effectId) {
    case 'weight':
      return { kind: 'weight', favored: rng.next() < 0.5 ? 'H' : 'T' }
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

/**
 * M7.6 (13a.14): forge two coins — the target keeps its identity, the
 * special rules (core/forge) decide the result (a matching pair is consumed
 * and replaced; everything else stacks), the source is removed. Costs
 * FORGE_COST (no-op when the cash is short).
 */
export function mergeCoinDraft(st: Draft, fromId: number, toId: number): void {
  if (st.phase !== 'shop') return
  if (fromId === toId) return
  const collection = [...st.deck.drawPile, ...st.deck.discardPile]
  const from = collection.find((c) => c.id === fromId)
  const to = collection.find((c) => c.id === toId)
  if (!from || !to) return
  if (st.cash < FORGE_COST) return
  const outcome = forgeCoin(from, to)
  to.effects = outcome.effects
  st.cash -= FORGE_COST
  // First-match removal (ids are unique; a first-match splice is also safe if
  // a legacy save ever held a duplicate — a filter would drop both copies).
  removeFirstCoin(st.deck.drawPile, fromId)
  removeFirstCoin(st.deck.discardPile, fromId)
}

/** Remove the FIRST coin with the id from a pile (no-op when absent). */
function removeFirstCoin(pile: Coin[], id: number): void {
  const i = pile.findIndex((c) => c.id === id)
  if (i !== -1) pile.splice(i, 1)
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

/** 13a.15: unlimited rerolls — each one costs $1 more than the previous
 *  (rerollCost over the per-round counter). Broke → no-op. */
export function rerollDraft(st: Draft, rng: Rng): void {
  if (st.phase !== 'shop') return
  const cost = rerollCost(st.rerollCount)
  if (st.cash < cost) return // broke — reject
  st.cash -= cost
  st.rerollCount += 1
  st.shop.offers = generateOffers(rng, st.charms, st.handSize)
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
    // Weight rolls its favoured face now, fixed for the run.
    const coin: Coin = { id: nextCoinId(st), effects: [purchasedEffect(offer.effect, rng)] }
    st.deck.drawPile = [...st.deck.drawPile, coin]
    st.rngState = rng.state()
  } else {
    // M9.7: hand-size upgrade — +1 slot, up to HAND_SIZE_CAP.
    st.handSize += 1
  }
  // Remove the bought offer (structurally — the draft wraps the passed object).
  st.shop.offers = st.shop.offers.filter((o) => !sameOffer(o, offer))
}

/**
 * 13a.14 Recycler: sell a coin from the collection for its recycle price
 * ($1 per effect, $1 minimum). The coin is removed from the collection and
 * the cash is gained (the opposite of the old $1-delete removeCoin).
 */
export function sellCoinDraft(st: Draft, id: number): void {
  if (st.phase !== 'shop') return
  const collection = [...st.deck.drawPile, ...st.deck.discardPile]
  const coin = collection.find((c) => c.id === id)
  if (!coin) return
  st.cash += recyclePrice(coin)
  // First-match removal (as in mergeCoin — never drop a duplicate's twin).
  removeFirstCoin(st.deck.drawPile, id)
  removeFirstCoin(st.deck.discardPile, id)
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
  st.shop = { offers: [] }
  st.rngState = rng.state()
  st.phase = 'run'
  st.handPhase = 'draw'
}
