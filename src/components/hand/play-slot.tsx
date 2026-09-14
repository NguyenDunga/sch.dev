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
import type { HandSlot } from '@/core/types'
import { SPRING } from '@/lib/motion'
import { CoinBadges } from './coin-badges'
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
}

export function PlaySlot({ index, slot, revealed, onUnpick, onReflip }: PlaySlotProps) {
  if (slot.kind === 'empty') {
    return (
      <div className="play-slot" aria-hidden>
        <span className="play-slot-index">{index + 1}</span>
      </div>
    )
  }

  const coin = slot.coin

  // Revealed (toss/buff/score): the 3D toss coin settles on the resolved face
  // (12.5). In the buff phase an unused Echo coin is tappable to re-flip
  // (12.6) — the TossCoin is keyed by face + echoUsed so it re-mounts (and
  // re-animates, quick) when the re-flip resolves a new face.
  if (revealed) {
    const toss = (
      <TossCoin
        key={`${coin.id}-${slot.face}-${slot.echoUsed}`}
        face={slot.face}
        index={index}
        effects={coin.effects}
        quick={slot.echoUsed}
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

  // Face-down (play): the 2D coin seated in the well, tappable to unpick.
  return (
    <motion.button
      type="button"
      className="play-slot play-slot--filled"
      layoutId={`coin-${coin.id}`}
      layout
      transition={SPRING.soft}
      onClick={onUnpick}
      aria-label={`slot ${index + 1}, unpick`}
    >
      <CoinDisc face={undefined} />
      <span className="coin-badges">
        <CoinBadges effects={coin.effects} />
      </span>
    </motion.button>
  )
}
