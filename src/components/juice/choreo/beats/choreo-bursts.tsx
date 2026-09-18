// 13.3 — beats 2–6 juice of the scoring choreography (SDD UX §6/§7/§10):
// the particle bursts + per-beat sfx (13.5/13.7) and the big-hit flash.
// Purely presentational (UX §0).

import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { motion } from 'framer-motion'
import type { TierId } from '@/core/types'
import { CHOREO, EASING, SHAKE_DURATION } from '@/lib/motion'
import { SHAKE_AMPLITUDE, TIER_RANK, type Beat } from '../choreography'
import { shakeScreen } from '../../screen-shake'
import { emitBurst } from '../../particles'
import { playSfx } from '../../sfx'
import { useFlightTarget } from './use-flight-target'

interface BeatBurstsProps {
  beat: Beat
  tierColor: string | null
  /** The scored tier (drives the resolve shake amplitude, UX §7, and the
   *  tier-hit pitch, UX §10). */
  tier: TierId | null
  chipsRef: RefObject<HTMLElement | null>
  cashRef: RefObject<HTMLElement | null>
  /** The number of chip ticks (one per flying chip, UX §10). */
  chipTicks: number
  /** The number of cash clinks (one per cash coin, UX §10). */
  cashTicks: number
}

/** 13.5 — the particle bursts on their beats (UX §7): a chip burst (6–12,
 *  tier color) at the chips counter on beat 3, a cash burst at the cash
 *  counter on beat 6. 13.7 — the matching sounds (UX §10): the tier hit on
 *  beat 2 (pitch by tier rank), the rising chip ticks on beat 3, the mult
 *  flare on beat 4, and the cash clinks on beat 6. Purely presentational
 *  (UX §0). */
export function BeatBursts({ beat, tierColor, tier, chipsRef, cashRef, chipTicks, cashTicks }: BeatBurstsProps) {
  const chipsTarget = useFlightTarget(chipsRef)
  const cashTarget = useFlightTarget(cashRef)
  // 13.7 — the staggered tick timers (cleared on beat change / unmount).
  const beatTimers = useRef<number[]>([])
  useEffect(() => {
    return () => {
      for (const t of beatTimers.current) window.clearTimeout(t)
    }
  }, [])
  useEffect(() => {
    if (beat === 2 && tier) {
      // 13.7 — the tier hit, pitched up with the tier rank (UX §10).
      playSfx('tierHit', { rate: 1 + TIER_RANK[tier] * 0.08 })
    }
    if (beat === 3) {
      emitBurst({ x: chipsTarget.x, y: chipsTarget.y, color: tierColor ?? 'var(--primary)', count: 10 })
      // 13.7 — the chip ticks: one per flying chip, rising in pitch (UX §10).
      for (let i = 0; i < chipTicks; i++) {
        beatTimers.current.push(window.setTimeout(() => playSfx('chip', { rate: 1 + i * 0.06 }), i * 40))
      }
    }
    if (beat === 4) playSfx('mult')
    if (beat === 6) {
      emitBurst({ x: cashTarget.x, y: cashTarget.y, color: 'var(--heads)', count: 12 })
      // 13.7 — the cash clinks, one per cash coin (UX §10).
      for (let i = 0; i < cashTicks; i++) {
        beatTimers.current.push(window.setTimeout(() => playSfx('cash'), i * 80))
      }
    }
    // 13.6 — the resolve shake: amplitude scaled by tier (UX §7), zero
    // under reduced motion (the trigger is a no-op there, UX §8).
    if (beat === 5 && tier) shakeScreen({ amplitude: SHAKE_AMPLITUDE[tier], duration: SHAKE_DURATION })
    return () => {
      // Clear the pending ticks when the beat changes (no stale sounds).
      for (const t of beatTimers.current) window.clearTimeout(t)
      beatTimers.current = []
    }
  }, [beat, chipsTarget, cashTarget, tierColor, tier, chipTicks, cashTicks])
  return null
}

/** Beat 5 — the --primary flash on big hits (UX §6). */
export function PrimaryFlash() {
  return (
    <motion.div
      className="choreo-flash choreo-flash--primary"
      initial={{ opacity: 0.14 }}
      animate={{ opacity: 0 }}
      transition={{ duration: CHOREO.skip.duration, ease: EASING.out }} // 250ms flash (one-off, UX §6)
    />
  )
}
