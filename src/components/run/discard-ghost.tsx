// Discard ghost (13.1) — the component layer: the fixed overlay that plays
// every in-flight discard ghost (the coin flies to the well + fades, or a
// quick fade in place under reduced motion — the motion props are in
// discard-ghost.ts). The layer is pointer-events: none (never blocks input)
// and each ghost removes itself when its animation completes.

import { motion, useReducedMotion, type Transition } from 'framer-motion'
import { ghostMotionProps, type DiscardGhost } from './discard-ghost'
import { CoinBadges } from '@/components/hand/coin-badges'
import { CoinDisc } from '@/components/hand/coin-disc'

interface DiscardGhostLayerProps {
  ghosts: DiscardGhost[]
  onDone: (key: number) => void
}

/** The fixed overlay that plays every in-flight discard ghost. */
export function DiscardGhostLayer({ ghosts, onDone }: DiscardGhostLayerProps) {
  if (ghosts.length === 0) return null
  return (
    <div className="discard-ghost-layer" aria-hidden>
      {ghosts.map((g) => (
        <Ghost key={g.key} ghost={g} onDone={onDone} />
      ))}
    </div>
  )
}

function Ghost({ ghost, onDone }: { ghost: DiscardGhost; onDone: (key: number) => void }) {
  const reduceMotion = useReducedMotion()
  const { initial, animate, transition } = ghostMotionProps(!!reduceMotion, ghost.from, ghost.to)

  return (
    <motion.div
      className="discard-ghost"
      style={{ left: ghost.from.x, top: ghost.from.y, width: ghost.from.w, height: ghost.from.h }}
      initial={initial}
      animate={animate}
      transition={transition as unknown as Transition}
      onAnimationComplete={() => onDone(ghost.key)}
    >
      <CoinDisc face={undefined} />
      <CoinBadges effects={ghost.coin.effects} />
    </motion.div>
  )
}
