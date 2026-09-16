// Coin Glyph — the icon/symbol shown on the coin face (layer 3 of 5).
//
// The glyph is the primary visual signal for the face (H/T). It can be
// overridden by the resolver (e.g. weight+H = scale tip icon, jackpot =
// gold star, etc.).
//
// Colorblind-safe (13c.9): the icon shape is the primary signal; the face
// color is the secondary signal.

import type { Face } from '@/core/types'
import type { ResolvedCoinFace } from './coin-types'
import { FACE_ICONS, FACE_DOWN_ICON } from '@/lib/icons'

interface CoinGlyphProps {
  /** The face (undefined = face-down). */
  face?: Face
  /** The resolved visual state (may contain glyphOverride). */
  resolved?: ResolvedCoinFace
  /** Icon size in px (default 28). */
  size?: number
}

export function CoinGlyph({ face, resolved, size = 28 }: CoinGlyphProps) {
  // Face-down: show the face-down icon
  if (face === undefined) {
    const Icon = FACE_DOWN_ICON.icon
    return <Icon size={size} strokeWidth={2} aria-hidden className="coin-glyph coin-glyph--back" />
  }

  // Face-up: show the face icon (or override)
  const override = resolved?.glyphOverride
  if (override) {
    // Custom glyph from the resolver (future: map override → icon)
    // For now, fall through to the face icon
    const def = FACE_ICONS[face]
    const Icon = def.icon
    return (
      <Icon
        size={size}
        strokeWidth={2}
        aria-hidden
        className={`coin-glyph coin-glyph--${face === 'H' ? 'heads' : 'tails'} coin-glyph--override`}
      />
    )
  }

  const def = FACE_ICONS[face]
  const Icon = def.icon
  return (
    <Icon
      size={size}
      strokeWidth={2}
      aria-hidden
      className={`coin-glyph coin-glyph--${face === 'H' ? 'heads' : 'tails'}`}
    />
  )
}
