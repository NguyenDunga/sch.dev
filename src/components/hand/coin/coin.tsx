// Coin — the main coin component (composes all 5 layers).
//
// Layers (inside → out):
//   1. Shell   — 3-ring disc (outer, inner, face fill)
//   2. Face    — colored fill (from resolver)
//   3. Glyph   — icon/symbol (from resolver)
//   4. Badges  — effect icon pills
//   5. Motion  — deal flight, hover tilt, shake
//
// The coin is a pure visual component. It receives a `face` (H/T/undefined)
// and `effects` (the coin's effect list). The resolver computes the visual
// state; the layers render it.
//
// No state, no side effects. All interaction (pick, drag, discard) is
// handled by the parent (hand-coin, play-slot, etc.).

import type { CoinEffect, Face } from '@/core/types'
import { CoinShell } from './coin-shell'
import { CoinGlyph } from './coin-glyph'
import { CoinBadges } from './coin-badges'
import { CoinMotion } from './coin-motion'
import { resolveCoinFace } from './coin-resolver'
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
  /** Whether the coin is enabled (tilt interaction). */
  enabled?: boolean
  /** Whether a drag is in flight. */
  dragging?: boolean
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
}

export function Coin({
  face,
  effects,
  coinId,
  dealIndex,
  enabled = true,
  dragging = false,
  shaking = false,
  shakeKey = 0,
  events,
  size = 56,
  className,
}: CoinProps) {
  // Resolve the visual state for the current face
  const resolved = face !== undefined ? resolveCoinFace({ face, effects }) : undefined

  // Fire the mount event (if face is defined)
  if (events?.onMount && coinId && face) {
    const cid = coinId
    const f = face
    const h = events.onMount
    queueMicrotask(() => h({ coinId: cid, face: f, timestamp: 0 }))
  }

  const shellClasses = resolved?.customClasses ?? []
  const fullClassName = `coin${className ? ' ' + className : ''}`

  return (
    <div className={fullClassName}>
      <CoinMotion
        dealIndex={dealIndex}
        enabled={enabled}
        dragging={dragging}
        shaking={shaking}
        shakeKey={shakeKey}
      >
        <CoinShell
          color={resolved?.color ?? (face === 'H' ? 'var(--heads)' : face === 'T' ? 'var(--tails)' : 'var(--surface-sunk)')}
          border={resolved?.border || undefined}
          glow={resolved?.glow || undefined}
          tilt={resolved?.tilt ?? 0}
          scale={resolved?.scale ?? 1}
          customClasses={shellClasses}
          size={size}
        >
          {/* Glyph (centered on the shell) */}
          <div className="coin-glyph-layer">
            <CoinGlyph face={face} resolved={resolved} size={Math.round(size * 0.5)} />
          </div>
        </CoinShell>

        {/* Badges (below the shell) */}
        <CoinBadges effects={effects} />
      </CoinMotion>
    </div>
  )
}
