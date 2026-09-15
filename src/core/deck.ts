import { BASE_DECK_SIZE, STARTER_WEIGHT_COINS } from './balance'
import { none, some } from './helpers'
import type { Rng } from './rng'
import type { Coin, Deck, Option } from './types'

/**
 * C11 — coin collection (Balatro-style, SDD C11).
 * Pure functions: inputs in, new values out, arguments never mutated. The
 * store owns the Deck value and applies the pile changes. The collection
 * (drawPile + discardPile) persists for the whole run; the draw pile is
 * finite within a blind (no mid-blind reshuffle) and the discard pile is
 * cleared at each blind start.
 */

/**
 * Fresh run: the m13a base collection — plain 50/50 coins + Weight coins
 * that all favor Heads (aligned favored faces; plan_balance-baseline.md).
 * Ids 0..size-1.
 */
export function buildCollection(): Deck {
  const plain = Array.from(
    { length: BASE_DECK_SIZE - STARTER_WEIGHT_COINS },
    (_, i): Coin => ({ id: i, effects: [] }),
  )
  const weight = Array.from({ length: STARTER_WEIGHT_COINS }, (_, i): Coin => ({
    id: BASE_DECK_SIZE - STARTER_WEIGHT_COINS + i,
    effects: [{ kind: 'weight', favored: 'H' }],
  }))
  return { drawPile: [...plain, ...weight], discardPile: [] }
}

/**
 * Blind start: merge both piles, Fisher–Yates shuffle into the draw pile,
 * clear the discard pile. One rng draw per swap (draw-order contract, step 1).
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
 * Peek the next coin of the draw pile (no rng — the shuffle supplies the
 * randomness); `none` when the pile is empty (the hand shrinks). The caller
 * pops the pile (`drawPile.slice(1)`) after taking the coin.
 */
export function drawFromDeck(deck: Deck): Option<Coin> {
  return deck.drawPile.length > 0 ? some(deck.drawPile[0]) : none
}

/** Move a coin to the discard pile — gone for the rest of the blind. */
export function discardToPile(deck: Deck, coin: Coin): Deck {
  return { ...deck, discardPile: [...deck.discardPile, coin] }
}
