// Play slot (12.4 + 12.5) — one of the five play-area slots.
//
//   empty                → a sunk dashed well with its index number
//   filled + face-down   → the coin seated in the well (2D, tappable to unpick)
//   filled + revealed    → the 3D toss coin (12.5): arcs up, tumbles, settles
//                          on the resolved face (2D cross-fade under reduced
//                          motion). Display only — no unpick once tossed.
//
// The pick/unpick spring (12.4) animates the coin between the hand and the
// play slot via a shared framer-motion `layoutId`.

import { motion } from 'framer-motion'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import type { HandSlot } from '@/core/types'
import { SPRING } from '@/lib/motion'
import { CoinDisc } from './coin-disc'
import { TossCoin } from './toss-coin'

interface PlaySlotProps {
  index: number
  slot: HandSlot
  /** Whether the coin has been tossed (face revealed). */
  revealed: boolean
  onUnpick: () => void
  /** Buff phase: re-flip an unused Echo coin (provided only when allowed). */
  onReflip?: () => void
  /** 13b.8: the tossed coin has landed (with its slot index) — drives the
   *  projection / sfx / auto-score from the toss animation (no setTimeout). */
  onLand?: (index: number) => void
  /** 13a.5: droppable ref for the slot root (reorder drop target). */
  slotRef?: (el: HTMLElement | null) => void
  /** 13a.5: a drag hovers over this slot (dashed ring). */
  over?: boolean
  /** 13a.5: draggable ref for the face-down coin (reorder). */
  dragRef?: (el: HTMLElement | null) => void
  /** 13a.5: the face-down coin is being dragged (dims). */
  dragging?: boolean
  /** 13a.5: dnd-kit pointer listeners for the face-down coin. */
  dragProps?: DraggableSyntheticListeners
}

/** Tossed (revealed) coin: settles on the resolved face (12.5); in the buff
 *  phase an unused Echo coin is tappable to re-flip (12.6) — the TossCoin is
 *  keyed by face + echoUsed so it re-mounts (and re-animates, quick) when the
 *  re-flip resolves a new face. */
function RevealedSlot({ slot, index, onReflip, onLand }: { slot: Extract<HandSlot, { kind: 'filled' }>; index: number; onReflip?: () => void; onLand?: (index: number) => void }) {
  const coin = slot.coin
  const toss = (
    <TossCoin
      key={`${coin.id}-${slot.face}-${slot.echoUsed}`}
      face={slot.face}
      index={index}
      effects={coin.effects}
      quick={slot.echoUsed}
      onLand={onLand}
    />
  )
  if (onReflip) {
    return (
      <button type="button" className="play-slot play-slot--reflip" onClick={onReflip} aria-label={`re-flip slot ${index + 1}`}>
        {toss}
      </button>
    )
  }
  return toss
}

export function PlaySlot({
  index,
  slot,
  revealed,
  onUnpick,
  onReflip,
  onLand,
  slotRef,
  over,
  dragRef,
  dragging,
  dragProps,
}: PlaySlotProps) {
  if (slot.kind === 'empty') {
    return (
      <div ref={slotRef} className={`play-slot${over ? ' play-slot--over' : ''}`} aria-hidden>
        <span className="play-slot-index">{index + 1}</span>
      </div>
    )
  }

  if (revealed) return <RevealedSlot slot={slot} index={index} onReflip={onReflip} onLand={onLand} />

  const coin = slot.coin

  // Face-down (play): the 2D coin seated in the well, tappable to unpick.
  // Pick (13.1, UX §5): the coin springs in with `spring-snappy` — the
  // crossfade plays on the element that mounts (this one). Unpick uses
  // `spring-soft` (the hand coin's layout transition).
  // 13a.5: draggable (reorder the row) + a drop target (move/swap).
  return (
    <motion.button
      ref={(el) => {
        slotRef?.(el)
        dragRef?.(el)
      }}
      type="button"
      className={`play-slot play-slot--filled${over ? ' play-slot--over' : ''}${dragging ? ' play-slot--dragging' : ''}`}
      layoutId={`coin-${coin.id}`}
      layout
      transition={SPRING.snappy}
      onClick={onUnpick}
      {...dragProps}
      aria-label={`slot ${index + 1}, unpick`}
    >
      <CoinDisc face={undefined} effects={coin.effects} />
    </motion.button>
  )
}
