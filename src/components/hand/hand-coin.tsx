// Hand coin (SDD C6 / UX §3) — a face-down coin in the hand with effect
// badges. Tap → pick into the next play slot (spring-snappy, shared
// layoutId with the play slot). The 6th pick (play full) shakes 3px
// (error sfx lands in M13).
//
// States (UX §3): default / hover (lift 4px + tilt toward cursor, max 8°,
// badges brighten) / press (depress 2px) / disabled (desaturated, no
// offset, cursor not-allowed) / focus-visible (3px coral ring) / selected
// (13a.5 multi-select: lift 6px + coral ring). "Selected" for a plain click
// is the pick itself — the coin springs out of the hand.
//
// 13a.5 drag & multi-select: `dragProps` carries dnd-kit's pointer
// listeners (press-drag to the play row); `onSelectClick` routes
// Ctrl/Cmd+click (toggle) and Shift+click (range) before a plain pick.
//
// Deal (13.1, UX §5): a coin that just came from the deck (`dealIndex`
// defined) flies in from the deck side — 220ms, 40ms stagger per deal
// index, ease-out. A coin returning from the play (unpick) has no
// `dealIndex`: `initial={false}` lets the shared-layout crossfade (play
// slot → hand, spring-soft) play instead. Reduced motion: quick fade, no
// flight/stagger (UX §8).

import { forwardRef, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent, PointerEvent } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
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
  /** 13a.5: the coin is in the multi-selection (lift + coral ring). */
  selected?: boolean
  /** 13a.5: a drag is in flight (the original dims; the overlay follows). */
  dragging?: boolean
  /** 13a.5: dnd-kit pointer listeners (press-drag to the play row). */
  dragProps?: DraggableSyntheticListeners
  /** 13a.5: Ctrl/Cmd+click / Shift+click routing — true = handled (no pick). */
  onSelectClick?: (e: ReactMouseEvent<HTMLButtonElement>) => boolean
  onPick: (el: HTMLElement) => void
  /** 13a.6: per-coin discard control — the D key while the coin is focused
   *  (the keyboard path to `discard` for no-pointer users). */
  onDiscard?: (el: HTMLElement) => void
  /** 13a.6: the pointer entered this coin (the quick-discard hotspot tracks
   *  the hovered coin). */
  onHover?: () => void
  /** 13a.6: the pointer left this coin. */
  onHoverEnd?: () => void
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

/** The hover tilt (UX §3): written straight to the DOM (no re-render per
 *  pointermove). Gated off under reduced motion (UX §8) and mid-drag. */
function useCoinTilt(enabled: boolean, dragging: boolean) {
  const tiltRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion() ?? false

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const el = tiltRef.current
    if (!el || !enabled || reduceMotion || dragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const x = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    // The tilt is a 3D rotation (rotateX/rotateY) — the CSS `rotate`
    // property takes a single angle, so it lives on `transform` (this div
    // carries no other transforms; framer's are on the button).
    el.style.transform = `rotateX(${(-y * MAX_TILT_DEG * 2).toFixed(2)}deg) rotateY(${(x * MAX_TILT_DEG * 2).toFixed(2)}deg)`
  }

  const onPointerLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = ''
  }

  return { tiltRef, onPointerMove, onPointerLeave, reduceMotion }
}

/** The a11y label: position, selection state, effect kinds, the discard key. */
function coinAriaLabel(index: number, enabled: boolean, selected: boolean, effects: Coin['effects']): string {
  const fx = effects.length ? ` (${effects.map((e) => e.kind).join(', ')})` : ''
  const discard = enabled ? ', press D to discard' : ''
  return `Pick coin ${index + 1}${selected ? ' (selected)' : ''}${fx}${discard}`
}

export const HandCoin = forwardRef<HTMLButtonElement, HandCoinProps>(function HandCoin(
  { coin, index, enabled, shaking, shakeKey, dealIndex, selected, dragging, dragProps, onSelectClick, onPick, onDiscard, onHover, onHoverEnd },
  ref,
) {
  const { tiltRef, onPointerMove, onPointerLeave, reduceMotion } = useCoinTilt(enabled, !!dragging)

  const handleClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    // 13a.5: Ctrl/Cmd+click (toggle) and Shift+click (range) are selection gestures — they never pick.
    if (onSelectClick?.(e)) return
    onPick(e.currentTarget)
  }

  /** 13a.6: the per-coin discard control — D while the coin is focused (the global shortcuts ignore D). */
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if ((e.key === 'd' || e.key === 'D') && enabled) {
      e.preventDefault()
      onDiscard?.(e.currentTarget)
    }
  }

  /** 13a.6: the pointer left — reset the tilt AND end the hover tracking. */
  const handlePointerLeave = () => {
    onPointerLeave()
    onHoverEnd?.()
  }

  const { initial, transition } = dealProps(dealIndex, reduceMotion)

  return (
    <motion.button
      ref={ref}
      type="button"
      layoutId={`coin-${coin.id}`}
      layout
      transition={{ layout: SPRING.soft }}
      className={handCoinClass(enabled, !!selected, !!dragging)}
      disabled={!enabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerMove={onPointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={() => onHover?.()}
      {...dragProps}
      aria-label={coinAriaLabel(index, enabled, !!selected, coin.effects)}
    >
      {/* The deal-flight layer: animates once on mount (fresh deal only).
          Kept separate from the tilt div so the shake remount (key) never
          replays the deal. */}
      <motion.div className="hand-coin-deal" initial={initial} animate={{ x: 0, y: 0, opacity: 1, scale: 1 }} transition={transition}>
        {/* key=shakeKey remounts the div so the shake animation restarts */}
        <div key={shaking ? shakeKey : 0} ref={tiltRef} className={`hand-coin-tilt${shaking ? ' hand-coin-tilt--shake' : ''}`}>
          <CoinDisc />
          <CoinBadges effects={coin.effects} />
        </div>
      </motion.div>
    </motion.button>
  )
})

/** The hand coin's class name (the state set, UX §3). */
function handCoinClass(enabled: boolean, selected: boolean, dragging: boolean): string {
  return `hand-coin${enabled ? '' : ' hand-coin--disabled'}${selected ? ' hand-coin--selected' : ''}${
    dragging ? ' hand-coin--dragging' : ''
  }`
}
