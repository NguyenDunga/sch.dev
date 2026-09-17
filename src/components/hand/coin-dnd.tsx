// 13a.5 — Coin drag & drop (dnd-kit): press-drag a hand coin onto the play
// row to pick it; dragging a SELECTED coin moves the whole selection.
//
// The store does the move (`pickCoin` — the same action the plain click
// calls, UX §0); the framer `layoutId` spring plays the flight into the
// slot (UX §5 `pick`). While a drag is in flight the original coin dims and
// a DragOverlay copy follows the pointer. The 6px activation constraint
// keeps plain clicks out of the drag (the click fallback, 13a.12).

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useCallback, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, ReactNode, RefObject } from 'react'
import type { Coin, Hand, HandSlot } from '@/core/types'
import { routeDrop } from './coin-dnd'
import { CoinDisc } from './coin-disc'
import { HandCoin } from './hand-coin'
import { PlaySlot } from './play-slot'
import { DiscardWell } from '@/components/run/piles'

const DRAG_ID_PREFIX = 'hand-'

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
      <CoinDisc effects={coin.effects} />
    </div>
  )
}

/** The play row as a drop target (dashed ring while a coin hovers over it). */
export function PlayDropZone({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'play-row' })
  return (
    <div ref={setNodeRef} className={`play-drop-zone${isOver ? ' play-drop-zone--over' : ''}`}>
      {children}
    </div>
  )
}

/** 13a.6: the discard well as an always-live drop target (dashed ring while
 *  a coin hovers over it). Dropping a hand coin on it discards — the store
 *  does the move (`discard`, the same action the other paths call); the
 *  discard ghost plays the flight (13.1). */
export function DiscardWellDrop({ wellRef }: { wellRef: RefObject<HTMLDivElement | null> }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'discard-well' })
  return (
    <div ref={setNodeRef} className={`discard-well-drop${isOver ? ' discard-well-drop--over' : ''}`}>
      <DiscardWell wellRef={wellRef} />
    </div>
  )
}

interface PlaySlotDndProps {
  index: number
  slot: HandSlot
  revealed: boolean
  /** 13a.5: reorder is allowed only in the play phase (face-down coins). */
  canReorder: boolean
  onUnpick: () => void
  onReflip?: () => void
  /** 13b.8: the tossed coin has landed (with its slot index). */
  onLand?: (index: number) => void
}

/** 13a.5: a play slot with dnd wired in — the face-down coin is draggable
 *  (reorder the row) and every slot is a drop target (move/swap). The store
 *  does the move (`movePlayCoin`); the layoutId spring plays the slide. */
export function PlaySlotDnd({ index, slot, revealed, canReorder, onUnpick, onReflip, onLand }: PlaySlotDndProps) {
  const reorderable = canReorder && slot.kind === 'filled'
  const { setNodeRef: dragSetRef, listeners, isDragging } = useDraggable({
    id: `play-${index}`,
    disabled: !reorderable,
  })
  const { setNodeRef: dropSetRef, isOver } = useDroppable({ id: `slot-${index}`, disabled: revealed })

  return (
    <PlaySlot
      index={index}
      slot={slot}
      revealed={revealed}
      onUnpick={onUnpick}
      onReflip={onReflip}
      onLand={onLand}
      slotRef={dropSetRef}
      over={isOver}
      dragRef={dragSetRef}
      dragging={isDragging}
      dragProps={listeners}
    />
  )
}

interface DraggableHandCoinProps {
  coin: Coin
  index: number
  enabled: boolean
  shaking: boolean
  shakeKey: number
  dealIndex?: number
  selected: boolean
  onPick: (el: HTMLElement) => void
  /** Ctrl/Cmd+click: toggle this coin in the multi-selection. */
  onToggleSelect: () => void
  /** Shift+click: range-select from the last anchor to this coin. */
  onRangeSelect: () => void
  /** 13a.6: per-coin discard control (the D key while the coin is focused).
   *  The store does the move (`discard`). */
  onDiscard?: (el: HTMLElement) => void
  /** 13a.6: the pointer entered this coin (the quick-discard hotspot tracks
   *  the hovered coin). */
  onHover?: () => void
  /** 13a.6: the pointer left this coin. */
  onHoverEnd?: () => void
  /** 13a.6: register this coin's element (the discard ghost's flight origin). */
  registerRef?: (el: HTMLButtonElement | null) => void
}

/** A hand coin with dnd-kit drag wired in: press-drag to the play row picks
 *  it (or its whole selection); press-drag to the discard well discards it
 *  (13a.6). Plain click still picks; Ctrl/Cmd+click and Shift+click drive
 *  the multi-select instead; D (focused) discards (13a.6). */
export function DraggableHandCoin({
  coin, index, enabled, shaking, shakeKey, dealIndex, selected,
  onPick, onToggleSelect, onRangeSelect, onDiscard, onHover, onHoverEnd, registerRef,
}: DraggableHandCoinProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAG_ID_PREFIX}${index}`,
    disabled: !enabled,
  })

  // The dnd-kit node ref + the coin-element registry (ghost origin) share
  // one callback ref.
  const ref = useCallback(
    (el: HTMLButtonElement | null) => {
      setNodeRef(el)
      registerRef?.(el)
    },
    [setNodeRef, registerRef],
  )

  const onSelectClick = (e: ReactMouseEvent<HTMLButtonElement>): boolean => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      onToggleSelect()
      return true
    }
    if (e.shiftKey) {
      onRangeSelect()
      return true
    }
    return false
  }

  return (
    <HandCoin
      ref={ref}
      coin={coin}
      index={index}
      enabled={enabled}
      shaking={shaking}
      shakeKey={shakeKey}
      dealIndex={dealIndex}
      selected={selected}
      dragging={isDragging}
      dragProps={listeners}
      onSelectClick={onSelectClick}
      onPick={onPick}
      onDiscard={onDiscard}
      onHover={onHover}
      onHoverEnd={onHoverEnd}
    />
  )
}
