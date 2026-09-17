// Hand coin (SDD C6 / UX §3) — a face-down coin in the hand with effect
// badges. Tap → pick into the next play slot (spring-snappy, shared
// layoutId with the play slot). The 6th pick (play full) shakes 3px
// (error sfx lands in M13).
//
// States (UX §3): default / hover (pick-up: lift 4px, badges brighten) /
// press (depress 2px) / disabled (desaturated, no offset, cursor not-allowed)
// / focus-visible (3px coral ring) / selected (13a.5 multi-select: lift 6px
// + coral ring). "Selected" for a plain click is the pick itself — the coin
// springs out of the hand.
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

import { forwardRef, useEffect } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { motion, useAnimate, useMotionValue, useReducedMotion } from 'framer-motion'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { CHOREO, DEAL, DURATION, EASING, SPRING } from '@/lib/motion'
import type { Coin } from '@/core/types'
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

/** Deal flight origin (13.1): toward the deck (top-right of the hand row). */
const DEAL_FROM = { x: 140, y: -110, scale: 0.85 }

/** The deal-flight initial values + transition (13.1). `dealIndex` undefined
 *  → no flight (the shared-layout crossfade plays instead); reduced motion →
 *  a quick fade with no offset/stagger (UX §8). */
function dealProps(dealIndex: number | undefined, reduceMotion: boolean) {
  if (dealIndex === undefined) return { initial: false, transition: undefined }
  if (reduceMotion) {
    return { initial: { opacity: 0 }, transition: { duration: DURATION.quick / 1000, ease: EASING.out } }
  }
  return {
    initial: { x: DEAL_FROM.x, y: DEAL_FROM.y, opacity: 0, scale: DEAL_FROM.scale },
    transition: { duration: DEAL.duration, delay: dealIndex * DEAL.stagger, ease: EASING.out },
  }
}

/** The 6th-pick shake (3px, UX §3): a Motion keyframe run on shakeKey change
 *  (was a CSS @keyframes + `key` remount). Gated off under reduced motion
 *  (UX §8). The hover pick-up is CSS (coin.css: `.hand-coin:hover` →
 *  `translate 0 -4px`) — no 3D pointer tilt. */
function useCoinShake(shaking: boolean, shakeKey: number) {
  const reduceMotion = useReducedMotion() ?? false
  const shakeX = useMotionValue(0)
  const [, animate] = useAnimate()

  useEffect(() => {
    if (!shaking || reduceMotion) return
    const a = animate(shakeX, [0, -3, 3, -3, 3, 0], { duration: CHOREO.shake.duration, ease: 'easeOut' })
    return () => a.stop()
  }, [shaking, shakeKey, reduceMotion, animate, shakeX])

  return { shakeX, reduceMotion }
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
  const { shakeX, reduceMotion } = useCoinShake(shaking, shakeKey)

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
      onPointerLeave={onHoverEnd}
      onPointerEnter={() => onHover?.()}
      {...dragProps}
      aria-label={coinAriaLabel(index, enabled, !!selected, coin.effects)}
    >
      {/* The deal-flight layer: animates once on mount (fresh deal only).
          Kept separate from the shake layer so the shake never replays the
          deal. The shake (x keyframes) is Motion-driven (13b.6) — no direct
          style writes, no key remount. The hover pick-up is CSS. */}
      <motion.div className="hand-coin-deal" initial={initial} animate={{ x: 0, y: 0, opacity: 1, scale: 1 }} transition={transition}>
        <motion.div className="hand-coin-lift" style={{ x: shakeX }}>
          <CoinDisc effects={coin.effects} />
        </motion.div>
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
