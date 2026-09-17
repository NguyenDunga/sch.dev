// 13a.5 — a play slot with dnd wired in: the face-down coin is draggable
// (reorder the row) and every slot is a drop target (move/swap). The store
// does the move (`movePlayCoin`); the layoutId spring plays the slide.

import { useDraggable, useDroppable } from '@dnd-kit/core'
import type { Face, HandSlot } from '@/core/types'
import { PlaySlot } from '../play-slot/play-slot'

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
  /** Magnetic pre-display: the face to pre-display on the face-down back. */
  predisplayFace?: Face
}

export function PlaySlotDnd({ index, slot, revealed, canReorder, onUnpick, onReflip, onLand, predisplayFace }: PlaySlotDndProps) {
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
      predisplayFace={predisplayFace}
    />
  )
}
