// Coin Face — the colored fill of the coin (layer 2 of 5).
//
// The face is the background color of the coin's center. It's resolved by
// the chain resolver based on the coin's effects.
//
// When face-down (no face resolved), the face shows the back color.

import type { Face } from '@/core/types'
import type { ResolvedCoinFace } from './coin-types'

interface CoinFaceProps {
  /** The resolved face (undefined = face-down). */
  face?: Face
  /** The resolved visual state (from the resolver). */
  resolved?: ResolvedCoinFace
}

/** The face-down back color. */
const BACK_COLOR = 'var(--surface-sunk)'

export function CoinFace({ face, resolved }: CoinFaceProps) {
  // Face-down: show the back
  if (face === undefined) {
    return <div className="coin-face coin-face--back" style={{ background: BACK_COLOR }} />
  }

  // Face-up: show the resolved color
  const color = resolved?.color ?? (face === 'H' ? 'var(--heads)' : 'var(--tails)')

  const customClasses = resolved?.customClasses ?? []
  const className = `coin-face coin-face--${face === 'H' ? 'heads' : 'tails'}${
    customClasses.length ? ' ' + customClasses.join(' ') : ''
  }`

  return <div className={className} style={{ background: color }} />
}
