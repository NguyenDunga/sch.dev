import type { Rng } from './rng'
import { isFilled, none, some } from './helpers'
import type { Coin, Deck, Hand, Option } from './types'

/**
 * C11 — coin collection (Balatro-style, SDD C11, 2026-09-13 Q&A round 2).
 * Pure functions; the store owns the Deck value and applies the pile
 * changes. The collection (drawPile + discardPile) persists for the whole
 * run; the draw pile is finite within a blind (no reshuffle) and the
 * discard pile is cleared at each blind start.
 */

/** Fresh run: base collection of plain 50/50 coins (ids 0..size-1). */
export function buildCollection(size: number): Deck {
  return {
    drawPile: Array.from({ length: size }, (_, i): Coin => ({ id: i, effects: [] })),
    discardPile: [],
  }
}

/**
 * Blind start: merge both piles, Fisher–Yates shuffle into the draw pile,
 * clear the discard pile. Consumes one rng draw per swap (draw-order
 * contract, step 1).
 */
export function shuffleCollection(rng: Rng, deck: Deck): Deck {
  const all = [...deck.drawPile, ...deck.discardPile]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return { drawPile: all, discardPile: [] }
}

/**
 * Peek the next coin from the draw pile (no rng — the shuffle supplies the
 * randomness). `none` when the pile is empty (the hand shrinks). The caller
 * pops the pile (`drawPile.slice(1)`) after taking the coin.
 */
export function drawFromDeck(deck: Deck): Option<Coin> {
  return deck.drawPile.length > 0 ? some(deck.drawPile[0]) : none
}

/** Move a coin to the discard pile — gone for the rest of the blind. */
export function discardToPile(deck: Deck, coin: Coin): Deck {
  return { ...deck, discardPile: [...deck.discardPile, coin] }
}

/**
 * After scoring: all hand coins → discard pile (gone for the rest of the
 * blind, no circulation; recycled into the draw pile at the next blind start).
 * Empty slots count as nothing.
 */
export function returnHandToPile(deck: Deck, hand: Hand): Deck {
  const coins = hand.filter(isFilled).map((s) => s.coin)
  return { ...deck, discardPile: [...deck.discardPile, ...coins] }
}
