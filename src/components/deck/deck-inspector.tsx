// Deck inspector — the single shared deck button (shop header + run play
// area). A clickable deck pile: face-down coin stack + the number of coins in
// the DRAW pile (the coins still left to draw). Clicking toggles the read-only
// PilePanel (shared with the discard well). The discard pile lives in the
// discard well, not here — showing it in both was the source of the
// "discarded coins appear in the deck" confusion.
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
  const [open, setOpen] = useState(false)
  const count = drawPile.length

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
          title="Draw pile"
          coins={drawPile}
          emptyText="No coins left to draw"
          note="Discarded coins are in the discard well"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
