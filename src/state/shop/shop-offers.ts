// C8 — Shop entry + offer generation (M9.1, M10.2).
//
// Shop phase: blind cleared (not the last one) → the shop with a fresh set
// of offers. The shop ACTIONS (buy / reroll / mergeCoin / sellCoin /
// moveCharm / leaveShop) live in shopActions.ts.

import { HAND_SIZE_CAP, SHOP_SLOTS } from '@/core/shop'
import { COIN_CATALOG } from '@/config/coins'
import { CHARM_CATALOG } from '@/config/charms'
import { emptyHand, isFilled } from '@/core/helpers'
import type { Rng } from '@/core/rng'
import type { CoinEffect, CoinEffectId, RunState, ShopOffer } from '@/core/types'
import type { Draft } from '../storeTypes'

/**
 * M10.2: blind cleared (not the last one) → the shop: phase 'shop' with a
 * fresh set of offers. The reroll price counter (13a.15) resets here only
 * after a boss blind. Called from hand-score.endBlind — the run flow only
 * decides *that* the blind is cleared; the shop entry itself lives here.
 */
export function enterShopDraft(st: Draft, rng: Rng): void {
  st.phase = 'shop'
  // 13a.15: the reroll price counter resets after a boss blind (a new round
  // starts) — it persists across the shops of a round.
  if (st.blindIndex % 3 === 2) st.rerollCount = 0
  // 13a.2 keep-unplayed: the hand may still hold unplayed coins from the last
  // hand. Merge them into the deck NOW (not at leaveShop) so the shop's
  // Recycler/Forge see the WHOLE collection and can sell/merge them — leaving
  // them in the hand meant they were invisible in the shop and re-appeared in
  // the deck after selling every copy of a coin (player report).
  const inHand = st.hand.filter(isFilled).map((s) => s.coin)
  st.deck.drawPile = [...st.deck.drawPile, ...inHand]
  st.hand = emptyHand(st.handSize)
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
    ...CHARM_CATALOG.filter((c) => !charms.includes(c.id)).map(
      (c): ShopOffer => ({ kind: 'charm', charm: c.id }),
    ),
    ...COIN_CATALOG.map((c): ShopOffer => ({ kind: 'coin', effect: c.effect })),
  ]
  if (handSize < HAND_SIZE_CAP) pool.push({ kind: 'handSize' })
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, SHOP_SLOTS)
}

/** Two offers are the same item (structural — the immer draft wraps references). */
export function sameOffer(a: ShopOffer, b: ShopOffer): boolean {
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
export function nextCoinId(st: Draft): number {
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
export function purchasedEffect(effectId: CoinEffectId, rng: Rng): CoinEffect {
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
