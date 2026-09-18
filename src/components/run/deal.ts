// Deal detection (13.1, UX §5) — pure helper: which hand coins just arrived
// from the deck (and their stagger index). Used by the Run screen's
// `useDeals` hook; kept in its own module so run.tsx only exports components
// (react-refresh) and the logic is unit-testable without a DOM.

import type { Hand, HandSlot } from '@/core/types'

/** Coin ids of the previous render's hand/play. */
export interface PrevSlots {
  hand: Set<number>
  play: Set<number>
}

/** A hand coin that was in neither the previous hand nor the previous play
 *  just arrived from the deck → it gets a stagger index (0-based, in slot
 *  order) for the `deal` animation. Unpick returns (prev play) and coins
 *  already seated in the hand get no index — they use the shared-layout
 *  crossfade instead of the deal flight. */
export function computeDealIndex(hand: Hand, prev: PrevSlots): Map<number, number> {
  const deals = new Map<number, number>()
  for (const slot of hand) {
    if (slot.kind !== 'filled') continue
    const id = slot.coin.id
    if (!prev.hand.has(id) && !prev.play.has(id)) deals.set(id, deals.size)
  }
  return deals
}

/** The filled coin ids of a hand/play row. */
export function idsOf(slots: HandSlot[]): Set<number> {
  const ids = new Set<number>()
  for (const s of slots) {
    if (s.kind === 'filled') ids.add(s.coin.id)
  }
  return ids
}

/** Content equality of a prev id-set and a row's filled ids. Set equality
 *  (not a slot count): if a row ever held two coins with the same id, the
 *  slot count would exceed the unique-id count and the comparison would
 *  never settle — looping the render-phase deal detection ("Too many
 *  re-renders", player report 2026-07-22). */
export function sameIds(ids: Set<number>, slots: HandSlot[]): boolean {
  const row = idsOf(slots)
  if (row.size !== ids.size) return false
  for (const id of row) {
    if (!ids.has(id)) return false
  }
  return true
}
