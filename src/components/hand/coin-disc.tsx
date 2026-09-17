// The coin disc — the round face of a coin (hand / play slots / discard
// ghost / shop collection). Shows either the back (face-down, hand / pre-toss
// play) or a resolved face (H/T).
//
// M19: the main glyph is the RadialReveal (`coin/coin-glyph`) — a
// conic-gradient ring (one wedge per effect) around a disk that shows the
// highest-priority effect by default and radially wipes in the hovered
// effect. `face === undefined` → face-down (the facedown stage).
//
// Colorblind-safe (13c.9 / UX §8): the icon shape is the primary signal; the
// face color is the secondary signal. Flat, not realistic (UX §2): flat color
// blocking, 2px --ink sticker border, no gradients, no blurred shadows.

import type { CoinEffect, Face } from '@/core/types'
import { CoinGlyph } from './coin/coin-glyph'

/**
 * The coin disc. `face === undefined` → face-down back. `face` = 'H'/'T' →
 * the resolved face. The main glyph is the RadialReveal: the disk shows the
 * highest-priority effect (or the face-state icon when there are no effects),
 * and each effect gets a ring wedge that radially wipes in its glyph on hover.
 */
export function CoinDisc({ face, effects = [] }: { face?: Face; effects?: CoinEffect[] }) {
  const faceClass = face === 'H' ? 'heads' : face === 'T' ? 'tails' : 'back'
  const label = face === 'H' ? 'Heads' : face === 'T' ? 'Tails' : 'face-down coin'
  // The RadialReveal (ring + disk) fills most of the 3.5rem (56px) disc:
  // 2px border + a small margin around the ring.
  const size = 44
  return (
    <span className={`coin-disc coin-disc--${faceClass}`} role="img" aria-label={label}>
      <CoinGlyph face={face} effects={effects} size={size} />
    </span>
  )
}
