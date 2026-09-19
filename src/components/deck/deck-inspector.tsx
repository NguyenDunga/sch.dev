// Deck inspector — the single shared deck button (shop header + run play
// area). A clickable deck pile: face-down coin stack + the number of coins in
// the deck (draw pile + discard pile). Clicking toggles the read-only
// PilePanel (shared with the discard well).
//
// Ceramic Tactile (UX §2): the pile is the visual origin of the `deal`
// animation in the play area; the button itself stays flat (no blurred
// shadows).

import { useState } from 'react'
import { Coin } from '@/components/hand/coin'
import { useRunStore } from '@/state/runStore'
import { PilePanel } from './pile-panel'

export function DeckInspector() {
  const drawPile = useRunStore((s) => s.deck.drawPile)
  const discardPile = useRunStore((s) => s.deck.discardPile)
  const [open, setOpen] = useState(false)
  const count = drawPile.length + discardPile.length

  return (
    <>
      <button
        type="button"
        className="deck deck-inspector"
        aria-label={open ? 'Hide deck' : 'Show deck'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="deck-stack" aria-hidden>
          <Coin face={undefined} effects={[]} size="sm" className="deck-disc deck-disc--2" />
          <Coin face={undefined} effects={[]} size="sm" className="deck-disc deck-disc--1" />
          <Coin face={undefined} effects={[]} size="sm" className="deck-disc deck-disc--top" />
        </span>
        <span className="pile-count">{count}</span>
      </button>
      {open && (
        <PilePanel
          title="Your deck"
          coins={[...drawPile, ...discardPile]}
          emptyText="No coins in the collection"
          note="Merge in the Forge · Sell in the Recycler"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
