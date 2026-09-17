// Coin — the main coin component (composes all 5 layers).
//
// Layers (inside → out):
//   1. Shell   — 3-ring disc (outer, inner, face fill)
//   2. Face    — colored fill (from resolver)
//   3. Glyph   — RadialReveal (M19): a conic-gradient ring (one wedge per
//                effect) around a disk showing the top effect; hovering a
//                wedge radially wipes in that effect's glyph
//   4. Motion  — deal flight, shake (hover pick-up is CSS, coin.css)
//
// The coin is a pure visual component. It receives a `face` (H/T/undefined)
// and `effects` (the coin's effect list). The resolver computes the visual
// state; the layers render it.
//
// No state, no side effects. All interaction (pick, drag, discard) is
// handled by the parent (hand-coin, play-slot, etc.).

import type { CoinEffect, Face } from '@/core/types'
import { CoinShell } from './coin-shell'
import { CoinGlyph } from './coin-glyph/coin-glyph'
import { CoinMotion } from './coin-motion'
import { resolveCoinFace } from './resolver/resolver'
import type { CoinEventHooks } from './coin-events'

export interface CoinProps {
  /** The face (H/T) or undefined for face-down. */
  face?: Face
  /** The coin's effects. */
  effects: CoinEffect[]
  /** The coin's id (for event hooks). */
  coinId?: string
  /** Stagger index for deal animation. */
  dealIndex?: number
  /** Whether the shake is playing. */
  shaking?: boolean
  /** Bumped on every shake. */
  shakeKey?: number
  /** Event hooks (onMount, onToss, etc.). */
  events?: CoinEventHooks
  /** Size in px (default 56). */
  size?: number
  /** Additional CSS classes. */
  className?: string
  /**
   * A face to pre-display on the face-down back (e.g. a Magnetic coin
   * pre-displays its left neighbour's known face). Only applies when face-down.
   */
  predisplayFace?: Face
}

export function Coin({
  face,
  effects,
  coinId,
  dealIndex,
  shaking = false,
  shakeKey = 0,
  events,
  size = 56,
  className,
  predisplayFace,
}: CoinProps) {
  // Resolve the visual state for the current face (face-down included).
  const resolved = resolveCoinFace({ face, effects, predisplayFace })

  // Fire the mount event (if face is defined)
  if (events?.onMount && coinId && face) {
    const cid = coinId
    const f = face
    const h = events.onMount
    queueMicrotask(() => h({ coinId: cid, face: f, timestamp: 0 }))
  }

  const shellClasses = resolved.customClasses ?? []
  const fullClassName = `coin${className ? ' ' + className : ''}`

  return (
    <div className={fullClassName}>
      <CoinMotion dealIndex={dealIndex} shaking={shaking} shakeKey={shakeKey}>
        <CoinShell
          color={resolved.color}
          border={resolved.border || undefined}
          glow={resolved.glow || undefined}
          customClasses={shellClasses}
          size={size}
        >
          {/* Glyph (centered on the shell) — the RadialReveal is sized to the
           *  face fill (size - 14: the shell's 8px inner ring + 6px face inset)
           *  so the sticker border stays visible around it. */}
          <div className="coin-glyph-layer">
            <CoinGlyph face={face} effects={effects} size={size - 14} />
          </div>
        </CoinShell>
      </CoinMotion>
    </div>
  )
}
