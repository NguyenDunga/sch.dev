// 13a.6 — the discard well as an always-live drop target (dashed ring while
// a coin hovers over it). Dropping a hand coin on it discards — the store
// does the move (`discard`, the same action the other paths call); the
// discard ghost plays the flight (13.1).

import { useDroppable } from '@dnd-kit/core'
import type { RefObject } from 'react'
import { DiscardWell } from '@/components/run/piles'

export function DiscardWellDrop({ wellRef }: { wellRef: RefObject<HTMLDivElement | null> }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'discard-well' })
  return (
    <div ref={setNodeRef} className={`discard-well-drop${isOver ? ' discard-well-drop--over' : ''}`}>
      <DiscardWell wellRef={wellRef} />
    </div>
  )
}
