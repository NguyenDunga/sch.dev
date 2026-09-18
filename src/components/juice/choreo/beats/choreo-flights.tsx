// 13.3 — beats 3 + 6 of the scoring choreography (SDD UX §6): the flying
// chips (chips build) and the cash coins (cash fly). Purely presentational
// (UX §0).

import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import type { CharmId, Score } from '@/core/types'
import { CHOREO, EASING } from '@/lib/motion'
import { chipCount, type SnapshotCoin } from '../choreography'
import { useFlightTarget } from './use-flight-target'

/** The coin row's center (viewport fractions) — the flights' origin. */
const ROW_X = 0.5
const ROW_Y = 0.44

interface ChipFlightProps {
  score: Score
  matched: number[]
  charms: CharmId[]
  tierColor: string | null
  targetRef: RefObject<HTMLElement | null>
}

/** Beat 3 — chips build: one chip per contributing coin/charm flies from
 *  the coin row to the chips counter (the counter ticks up in the ticker;
 *  the rising-pitch chip sfx lands in 13.7). */
export function ChipFlight({ score, matched, charms, tierColor, targetRef }: ChipFlightProps) {
  const target = useFlightTarget(targetRef)
  const n = chipCount(score, matched, charms)
  const cx = window.innerWidth * ROW_X
  const cy = window.innerHeight * ROW_Y
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const sx = cx + (i - (n - 1) / 2) * 36
        return (
          <motion.span
            key={i}
            className="choreo-chip"
            style={{ background: tierColor ?? 'var(--primary)' }}
            initial={{ x: sx, y: cy, opacity: 1, scale: 1 }}
            animate={{ x: target.x - sx, y: target.y - cy, opacity: 0.7, scale: 0.55 }}
            transition={{ duration: CHOREO.cashFly.duration, delay: i * CHOREO.cashFly.stagger, ease: EASING.out }}
          />
        )
      })}
    </>
  )
}

interface CashFlightProps {
  coins: SnapshotCoin[]
  targetRef: RefObject<HTMLElement | null>
}

/** Beat 6 — cash: each Tax/Jackpot coin flips up a coin that flies to the
 *  cash counter (250ms each, ease-back, 80ms stagger — UX §5 cash-fly). */
export function CashFlight({ coins, targetRef }: CashFlightProps) {
  const target = useFlightTarget(targetRef)
  const payers = coins.filter((c) => c.coin.effects.some((e) => e.kind === 'tax' || e.kind === 'jackpot'))
  const cx = window.innerWidth * ROW_X
  const cy = window.innerHeight * ROW_Y
  return (
    <>
      {payers.map((c, i) => (
        <motion.span
          key={c.coin.id}
          className="choreo-cash-coin"
          initial={{ x: cx, y: cy, opacity: 1, scale: 0.6, rotate: -90 }}
          animate={{ x: target.x - cx, y: target.y - cy, opacity: 0.9, scale: 1, rotate: 0 }}
          transition={{ duration: CHOREO.cashPop.duration, delay: i * CHOREO.cashPop.stagger, ease: EASING.back }}
        >
          $
        </motion.span>
      ))}
    </>
  )
}
