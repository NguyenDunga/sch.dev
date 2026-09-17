// Hand coin (SDD C6 / UX §3) — a face-down coin in the hand. Tap → pick into
// the next play slot (spring-snappy, shared layoutId with the play slot). The
// 6th pick (play full) shakes 3px (error sfx lands in M13).
//
// States (UX §3): default / hover (pick-up: lift 4px) / press (depress 2px) /
// disabled (desaturated, no offset, cursor not-allowed) / focus-visible (3px
// coral ring) / selected (13a.5 multi-select: lift 6px + coral ring).
// "Selected" for a plain click is the pick itself — the coin springs out of
// the hand.
//
// 13a.5 drag & multi-select: `dragProps` carries dnd-kit's pointer
// listeners (press-drag to the play row); `onSelectClick` routes
// Ctrl/Cmd+click (toggle) and Shift+click (range) before a plain pick.
//
// The coin visual is the new 5-layer coin (`./coin`): the deal flight (13.1,
// UX §5) and the 6th-pick shake live in `CoinMotion` (coin/coin-motion.tsx),
// and the hover pick-up is CSS (coin/coin.css: `.coin:hover`). This component
// is purely the interaction layer: the button, the shared-layout spring, the
// dnd wiring, and the keyboard path.

import { forwardRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react'
import { motion } from 'framer-motion'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'
import { SPRING } from '@/lib/motion'
import type { Coin } from '@/core/types'
import { Coin as CoinVisual } from '../coin'

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
      {/* The new 5-layer coin: CoinMotion plays the deal flight (fresh deal
          only — `dealIndex` undefined → the shared-layout crossfade) and the
          6th-pick shake (Motion-driven, 13b.6). The hover pick-up is CSS. */}
      <CoinVisual
        face={undefined}
        effects={coin.effects}
        dealIndex={dealIndex}
        shaking={shaking}
        shakeKey={shakeKey}
        size={56}
      />
    </motion.button>
  )
})

/** The hand coin's class name (the state set, UX §3). */
function handCoinClass(enabled: boolean, selected: boolean, dragging: boolean): string {
  return `hand-coin${enabled ? '' : ' hand-coin--disabled'}${selected ? ' hand-coin--selected' : ''}${
    dragging ? ' hand-coin--dragging' : ''
  }`
}
