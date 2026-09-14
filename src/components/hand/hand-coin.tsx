// Hand coin (SDD C6 / UX §3) — a face-down coin in the hand with effect
// badges. Tap → pick into the next play slot (spring-snappy, shared
// layoutId with the play slot). The 6th pick (play full) shakes 3px
// (error sfx lands in M13).
//
// States (UX §3): default / hover (lift 4px + tilt toward cursor, max 8°,
// badges brighten) / press (depress 2px) / disabled (desaturated, no
// offset, cursor not-allowed) / focus-visible (3px coral ring). "Selected"
// is the pick itself — the coin springs out of the hand.

import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { motion } from 'framer-motion'
import { SPRING } from '@/lib/motion'
import type { Coin } from '@/core/types'
import { CoinBadges } from './coin-badges'
import { CoinDisc } from './coin-disc'

interface HandCoinProps {
  coin: Coin
  index: number
  /** true only in the play hand-phase (pick is allowed). */
  enabled: boolean
  /** true while the 6th-pick shake is playing on this coin. */
  shaking: boolean
  /** Bumped on every shake so the CSS animation can restart. */
  shakeKey: number
  onPick: () => void
}

/** Max tilt in degrees (UX §3: max 8°). */
const MAX_TILT_DEG = 8

export function HandCoin({ coin, index, enabled, shaking, shakeKey, onPick }: HandCoinProps) {
  // The tilt is written straight to the DOM (no re-render per pointermove).
  // It lives on the inner div so it composes with the hover lift (CSS
  // `translate`) and the layout animation (framer `transform` on the button).
  const tiltRef = useRef<HTMLDivElement>(null)

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const el = tiltRef.current
    if (!el || !enabled) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.rotate = `${(-y * MAX_TILT_DEG * 2).toFixed(2)}deg ${(x * MAX_TILT_DEG * 2).toFixed(2)}deg`
  }

  const onPointerLeave = () => {
    if (tiltRef.current) tiltRef.current.style.rotate = ''
  }

  return (
    <motion.button
      type="button"
      layoutId={`coin-${coin.id}`}
      transition={{ layout: SPRING.soft }}
      className={`hand-coin${enabled ? '' : ' hand-coin--disabled'}`}
      disabled={!enabled}
      onClick={onPick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-label={`Pick coin ${index + 1}${coin.effects.length ? ` (${coin.effects.map((e) => e.kind).join(', ')})` : ''}`}
    >
      {/* key=shakeKey remounts the div so the shake animation restarts */}
      <div key={shaking ? shakeKey : 0} ref={tiltRef} className={`hand-coin-tilt${shaking ? ' hand-coin-tilt--shake' : ''}`}>
        <CoinDisc />
        <CoinBadges effects={coin.effects} />
      </div>
    </motion.button>
  )
}
