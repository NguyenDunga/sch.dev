// Discard well (13.1) — the pile flanking the hand row. (The draw pile is
// the shared DeckInspector button in components/deck.)
//
// Clicking the well toggles the read-only PilePanel (shared with the deck):
// the coins discarded this blind. The well is also the target of the
// `discard` animation (the ghost coin flies to `wellRef`).
//
// Ceramic Tactile (UX §2): flat discs, 2px --ink sticker border, hard offset
// only (no blurred shadows).

import { useState } from 'react'
import type { RefObject } from 'react'
import { ACTION_ICONS } from '../action-icons'
import { PilePanel } from '@/components/deck/pile-panel'
import { useRunStore } from '@/state/runStore'

/** The discard well: a sunk dashed circle + its count. `wellRef` marks the
 *  element the discard ghost flies to (13.1). Clicking toggles the panel. */
export function DiscardWell({ wellRef }: { wellRef: RefObject<HTMLDivElement | null> }) {
  const discardPile = useRunStore((s) => s.deck.discardPile)
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className="discard-well"
        aria-label={open ? 'Hide discard pile' : 'Show discard pile'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="discard-well-hole" ref={wellRef} aria-hidden>
          <ACTION_ICONS.discard.icon size={18} strokeWidth={2} aria-hidden />
        </div>
        <span className="pile-count">{discardPile.length}</span>
      </button>
      {open && (
        <PilePanel
          title="Discard pile"
          coins={discardPile}
          emptyText="Nothing discarded this blind"
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
