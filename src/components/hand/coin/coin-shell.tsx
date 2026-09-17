// Coin Shell — the 3-ring disc structure (outer ring, inner ring, face fill).
//
// Layer 1 of 5: Shell → Face → Glyph → Badges → Motion
//
// The shell is the outermost visual structure. It provides:
//   - Outer ring: 2px --ink border (the sticker edge)
//   - Inner ring: 1px --line border (a subtle inset ring)
//   - Face fill: the colored center (from the resolver)
//
// Accepts children (the glyph layer) rendered centered on the face.
//
// Flat, not realistic (UX §2): no gradients, no blurred shadows.

import type { CSSProperties, ReactNode } from 'react'

interface CoinShellProps {
  /** The resolved color for the face fill. */
  color: string
  /** The resolved border override (from effects). */
  border?: string
  /** The resolved glow (from effects). */
  glow?: string
  /** Custom CSS classes from the resolver. */
  customClasses?: string[]
  /** Size in px (default 56). */
  size?: number
  /** Children (the glyph layer). */
  children?: ReactNode
}

export function CoinShell({
  color,
  border,
  glow,
  customClasses = [],
  size = 56,
  children,
}: CoinShellProps) {
  const shellStyle: CSSProperties = {
    width: size,
    height: size,
    ...(glow ? { boxShadow: glow } : {}),
  }

  const outerBorder = border || '2px solid var(--ink)'

  const className = `coin-shell${customClasses.length ? ' ' + customClasses.join(' ') : ''}`

  return (
    <div className={className} style={shellStyle}>
      {/* Outer ring */}
      <div className="coin-shell-outer" style={{ border: outerBorder }}>
        {/* Inner ring */}
        <div className="coin-shell-inner">
          {/* Face fill */}
          <div className="coin-shell-face" style={{ background: color }} />
        </div>
      </div>
      {/* Children (glyph) rendered on top */}
      {children}
    </div>
  )
}
