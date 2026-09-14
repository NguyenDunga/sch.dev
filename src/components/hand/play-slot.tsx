// Play slot (SDD C6 / UX §3) — one of the 5 toss slots.
//
// Empty = a sunk well (dashed). Filled = the coin seated: face-down until
// the toss resolves it, then the face (H/T glyph + color) + face badge.
// Tap a seated coin in the play hand-phase → unpick (springs back to the
// hand, spring-soft, shared layoutId with the hand coin).

import { motion } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import { isFilled } from '@/core/helpers'
import type { HandSlot } from '@/core/types'
import { CoinBadges } from './coin-badges'
import { CoinDisc, FaceBadge } from './coin-disc'

interface PlaySlotProps {
  slot: HandSlot
  index: number
  /** true once the toss phase has resolved this coin's face. */
  revealed: boolean
  /** true only in the play hand-phase (unpick is allowed). */
  enabled: boolean
  onUnpick: () => void
}

export function PlaySlot({ slot, index, revealed, enabled, onUnpick }: PlaySlotProps) {
  if (!isFilled(slot)) {
    return (
      <div className="play-slot play-slot--empty" aria-hidden>
        <span className="play-slot-index">{index + 1}</span>
      </div>
    )
  }

  const { coin, face } = slot
  const faceUp = revealed
  return (
    <motion.button
      type="button"
      layoutId={`coin-${coin.id}`}
      transition={{ layout: SPRING.snappy }}
      className={`play-slot play-slot--filled${enabled ? '' : ' play-slot--disabled'}`}
      disabled={!enabled}
      onClick={onUnpick}
      aria-label={
        faceUp
          ? `Unpick coin ${index + 1} (${face === 'H' ? 'heads' : 'tails'})`
          : `Unpick coin ${index + 1}`
      }
    >
      <CoinDisc face={faceUp ? face : undefined} />
      <span className="coin-badges">
        {faceUp && <FaceBadge face={face} />}
        <CoinBadges effects={coin.effects} />
      </span>
    </motion.button>
  )
}
