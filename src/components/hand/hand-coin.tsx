// Hand coin (SDD C6 / UX §3) — a face-down coin in the hand with effect
// badges. Tap → pick into the next play slot (spring-snappy, shared
// layoutId with the play slot). The 6th pick (play full) shakes 3px
// (error sfx lands in M13).
//
// States (UX §3): default / hover (lift 4px + tilt toward cursor, max 8°,
// badges brighten) / press (depress 2px) / disabled (desaturated, no
// offset, cursor not-allowed) / focus-visible (3px coral ring). "Selected"
// is the pick itself — the coin springs out of the hand.
//
// Deal (13.1, UX §5): a coin that just came from the deck (`dealIndex`
// defined) flies in from the deck side — 220ms, 40ms stagger per deal
// index, ease-out. A coin returning from the play (unpick) has no
// `dealIndex`: `initial={false}` lets the shared-layout crossfade (play
// slot → hand, spring-soft) play instead. Reduced motion: quick fade, no
// flight/stagger (UX §8).

import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { DEAL, EASING, SPRING } from '@/lib/motion'
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
  /** Stagger index among the freshly dealt coins (undefined = not a fresh
   *  deal — e.g. an unpick return, which uses the layout crossfade). */
  dealIndex?: number
  onPick: (el: HTMLElement) => void
}

/** Max tilt in degrees (UX §3: max 8°). */
const MAX_TILT_DEG = 8

/** Deal flight origin (13.1): toward the deck (top-right of the hand row). */
const DEAL_FROM = { x: 140, y: -110, scale: 0.85 }

/** The deal-flight initial values + transition (13.1). `dealIndex` undefined
 *  → no flight (the shared-layout crossfade plays instead); reduced motion →
 *  a quick fade with no offset/stagger (UX §8). */
function dealProps(dealIndex: number | undefined, reduceMotion: boolean) {
  if (dealIndex === undefined) return { initial: false, transition: undefined }
  if (reduceMotion) {
    return { initial: { opacity: 0 }, transition: { duration: 0.16, ease: EASING.out } }
  }
  return {
    initial: { x: DEAL_FROM.x, y: DEAL_FROM.y, opacity: 0, scale: DEAL_FROM.scale },
    transition: { duration: DEAL.duration, delay: dealIndex * DEAL.stagger, ease: EASING.out },
  }
}

export function HandCoin({ coin, index, enabled, shaking, shakeKey, dealIndex, onPick }: HandCoinProps) {
  // The tilt is written straight to the DOM (no re-render per pointermove).
  // It lives on the inner div so it composes with the hover lift (CSS
  // `translate`) and the layout animation (framer `transform` on the button).
  const tiltRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false

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

  const { initial, transition } = dealProps(dealIndex, reduceMotion)

  return (
    <motion.button
      type="button"
      layoutId={`coin-${coin.id}`}
      layout
      transition={{ layout: SPRING.soft }}
      className={`hand-coin${enabled ? '' : ' hand-coin--disabled'}`}
      disabled={!enabled}
      onClick={(e) => onPick(e.currentTarget)}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      aria-label={`Pick coin ${index + 1}${coin.effects.length ? ` (${coin.effects.map((e) => e.kind).join(', ')})` : ''}`}
    >
      {/* The deal-flight layer: animates once on mount (fresh deal only).
          Kept separate from the tilt div so the shake remount (key) never
          replays the deal. */}
      <motion.div
        className="hand-coin-deal"
        initial={initial}
        animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
        transition={transition}
      >
        {/* key=shakeKey remounts the div so the shake animation restarts */}
        <div key={shaking ? shakeKey : 0} ref={tiltRef} className={`hand-coin-tilt${shaking ? ' hand-coin-tilt--shake' : ''}`}>
          <CoinDisc />
          <CoinBadges effects={coin.effects} />
        </div>
      </motion.div>
    </motion.button>
  )
}
