// The reduced-motion toss (UX §4/§8) — a 2D cross-fade of the face (~160ms):
// no arc, no tumble, no 3D, same landing face. The land sound still plays
// (reduced motion affects motion, not audio).

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { CoinEffect, Face } from '@/core/types'
import { DURATION } from '@/lib/motion'
import { Coin } from '../coin'
import { playSfx } from '@/components/juice/sfx'

interface CrossfadeCoinProps {
  face: Face
  effects: CoinEffect[]
  index: number
  onLand?: (index: number) => void
}

export function CrossfadeCoin({ face, effects, index, onLand }: CrossfadeCoinProps) {
  useEffect(() => {
    playSfx('land', { rate: 1 + (Math.random() * 0.1 - 0.05) })
    onLand?.(index)
  }, [onLand, index])
  return (
    <div className="toss-coin toss-coin--2d">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION.quick / 1000 }}
      >
        <Coin face={face} effects={effects} size={56} />
      </motion.div>
    </div>
  )
}
