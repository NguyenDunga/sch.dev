// Deck + discard well (13.1) — the two piles flanking the hand row.
//
// Presentational (UX §0: juice never mutates state): the deck shows the
// draw-pile count and is the visual origin of the `deal` animation (coins
// fly from here to the hand); the discard well shows the discard-pile count
// and is the target of the `discard` animation (the ghost coin flies here).
//
// Ceramic Tactile (UX §2): flat discs, 2px --ink sticker border, hard offset
// only (no blurred shadows).

import type { RefObject } from 'react'
import { Trash2 } from 'lucide-react'
import { useRunStore } from '@/state/runStore'

/** The draw pile: a small stack of face-down discs + its count. */
export function Deck() {
  const count = useRunStore((s) => s.deck.drawPile.length)
  return (
    <div className="deck" role="img" aria-label={`Draw pile, ${count} coins`}>
      <div className="deck-stack" aria-hidden>
        <span className="coin-disc coin-disc--back coin-disc--sm deck-disc deck-disc--2" />
        <span className="coin-disc coin-disc--back coin-disc--sm deck-disc deck-disc--1" />
        <span className="coin-disc coin-disc--back coin-disc--sm deck-disc deck-disc--top">?</span>
      </div>
      <span className="pile-count">{count}</span>
    </div>
  )
}

/** The discard well: a sunk dashed circle + its count. `wellRef` marks the
 *  element the discard ghost flies to (13.1). */
export function DiscardWell({ wellRef }: { wellRef: RefObject<HTMLDivElement | null> }) {
  const count = useRunStore((s) => s.deck.discardPile.length)
  return (
    <div className="discard-well" role="img" aria-label={`Discard pile, ${count} coins`}>
      <div className="discard-well-hole" ref={wellRef} aria-hidden>
        <Trash2 size={18} strokeWidth={2} aria-hidden />
      </div>
      <span className="pile-count">{count}</span>
    </div>
  )
}
