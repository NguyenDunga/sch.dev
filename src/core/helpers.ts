// Small pure helpers over the shared types. M1 keeps `types.ts` types-only
// (no runtime logic, no defaults), so the Option / HandSlot / Score value
// helpers live here instead. No game logic — one-liners only.

import type { Coin, Face, FilledHandSlot, Hand, HandSlot, Option, Score } from './types'

/** Option<T> constructors (the Rust `Option` helpers). */
export const some = <T>(value: T): Option<T> => ({ some: true, value })
export const none: Option<never> = { some: false }
export const isSome = <T>(o: Option<T>): o is { some: true; value: T } => o.some

/** Narrow a hand slot to its filled variant. */
export const isFilled = (slot: HandSlot): slot is FilledHandSlot => slot.kind === 'filled'

/** A fresh empty hand of `size` slots (hand length = handSize, base 8), each a distinct object. */
export const emptyHand = (size: number): Hand =>
  Array.from({ length: size }, (): HandSlot => ({ kind: 'empty' }))

/** Build a filled slot. */
export const filledSlot = (coin: Coin, face: Face, echoUsed = false): FilledHandSlot => ({
  kind: 'filled',
  coin,
  face,
  echoUsed,
})

/** Points a score is worth (0 for a no-tier hand). */
export const scoreTotal = (score: Score): number => (score.kind === 'scored' ? score.total : 0)
