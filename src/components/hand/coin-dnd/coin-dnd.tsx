// 13a.5 — Coin drag & drop (dnd-kit): press-drag a hand coin onto the play
// row to pick it; dragging a SELECTED coin moves the whole selection.
//
// The store does the move (`pickCoin` — the same action the plain click
// calls, UX §0); the framer `layoutId` spring plays the flight into the
// slot (UX §5 `pick`). While a drag is in flight the original coin dims and
// a DragOverlay copy follows the pointer. The 6px activation constraint
// keeps plain clicks out of the drag (the click fallback, 13a.12).

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Coin, Hand } from '@/core/types'
import { routeDrop } from './logic'
import { Coin as CoinVisual } from '../coin'

interface CoinDndProps {
  hand: Hand
  /** A hand coin was dropped on the play row: pick it (or its whole selection). */
  onDropToPlay: (handIndex: number) => void
  /** 13a.6: a hand coin was dropped on the discard well: discard it (or its
   *  whole selection). */
  onDropToDiscard: (handIndex: number) => void
  /** 13a.5: a play coin was dropped on a slot: reorder the row. */
  onMovePlay: (from: number, to: number) => void
  children: ReactNode
}

/** The dnd context + the pointer-followed drag overlay. */
export function CoinDnd({ hand, onDropToPlay, onDropToDiscard, onMovePlay, children }: CoinDndProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id)
    setActiveIndex(id.startsWith('hand-') ? Number(id.slice('hand-'.length)) : null)
  }
  const onDragEnd = (e: DragEndEvent) => {
    setActiveIndex(null)
    if (!e.over) return
    const route = routeDrop(e.active.id, e.over.id)
    if (route?.kind === 'pick') onDropToPlay(route.handIndex)
    else if (route?.kind === 'discard') onDropToDiscard(route.handIndex)
    else if (route?.kind === 'move') onMovePlay(route.from, route.to)
  }

  const activeCoin =
    activeIndex !== null && hand[activeIndex]?.kind === 'filled' ? hand[activeIndex].coin : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveIndex(null)}
    >
      {children}
      <DragOverlay dropAnimation={null}>{activeCoin ? <CoinDragOverlay coin={activeCoin} /> : null}</DragOverlay>
    </DndContext>
  )
}

/** The floating coin copy while a drag is in flight (dnd-kit positions it). */
export function CoinDragOverlay({ coin }: { coin: Coin }) {
  return (
    <div className="coin-drag-overlay" aria-hidden>
      <CoinVisual face={undefined} effects={coin.effects} size="md" />
    </div>
  )
}
