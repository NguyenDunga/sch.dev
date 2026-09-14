// The coin disc — the flat circle that shows either the back (face-down,
// hand / pre-toss play) or a resolved face (H/T glyph + color).
//
// Flat, not realistic (UX §2): flat color blocking, 2px --ink sticker
// border, no gradients, no blurred shadows. H/T carry a glyph + color —
// never color alone (colorblind-safe, UX §8).

import type { Face } from '@/core/types'

/**
 * The coin disc. `face === undefined` → face-down back (the FACE_DOWN
 * placeholder in the store is never shown — the UI passes undefined until
 * the toss phase resolves the face).
 */
export function CoinDisc({ face }: { face?: Face }) {
  if (face === undefined) {
    return (
      <span className="coin-disc coin-disc--back" role="img" aria-label="face-down coin">
        ?
      </span>
    )
  }
  const label = face === 'H' ? 'heads' : 'tails'
  return (
    <span className={`coin-disc coin-disc--${face.toLowerCase()}`} role="img" aria-label={label}>
      {face}
    </span>
  )
}

/**
 * Face badge (12.4): a small H/T pill in the face color, shown once the face
 * is resolved. The glyph is the primary signal and the color the secondary —
 * colorblind-safe (UX §8).
 */
export function FaceBadge({ face }: { face: Face }) {
  return (
    <span className={`face-badge face-badge--${face.toLowerCase()}`}>{face}</span>
  )
}
