// The coin disc (12.2) — the round face of a coin. Shows either the back
// (face-down, hand / pre-toss play) or a resolved face (H/T).
//
// 13c.3: the `?`/`H`/`T` text glyphs are replaced with themed coin icons
// (Heads / Tails / face-down) — a themed coin glyph beats a generic circle.
// Colorblind-safe (13c.9): the icon shape is the primary signal; the face
// color is the secondary signal.
//
// Flat, not realistic (UX §2): flat color blocking, 2px --ink sticker
// border, no gradients, no blurred shadows.

import type { Face } from '@/core/types'
import { FACE_DOWN_ICON, FACE_ICONS } from '@/lib/icons'

/**
 * The coin disc. `face === undefined` → face-down back. `face` = 'H'/'T' →
 * the resolved face (an icon, 13c.3).
 */
export function CoinDisc({ face }: { face?: Face }) {
  if (face === undefined) {
    return (
      <span className="coin-disc coin-disc--back" role="img" aria-label="face-down coin">
        <FACE_DOWN_ICON.icon size={28} strokeWidth={2} aria-hidden className="coin-disc-icon" />
      </span>
    )
  }
  const def = FACE_ICONS[face]
  const Icon = def.icon
  return (
    <span className={`coin-disc coin-disc--${face === 'H' ? 'heads' : 'tails'}`} role="img" aria-label={def.label}>
      <Icon size={28} strokeWidth={2} aria-hidden className="coin-disc-icon" />
    </span>
  )
}

/**
 * Face badge (12.4): a small pill with the face icon (13c.3), shown once the
 * face is resolved. The icon shape is the primary signal and the color the
 * secondary — colorblind-safe (UX §8).
 */
export function FaceBadge({ face }: { face: Face }) {
  const def = FACE_ICONS[face]
  const Icon = def.icon
  return (
    <span className={`face-badge face-badge--${face === 'H' ? 'heads' : 'tails'}`} title={def.label}>
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </span>
  )
}
