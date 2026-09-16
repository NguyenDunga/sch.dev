// Effect badges shown under a coin (the 9 effects; Draw shows its tier).
// Shared by the hand coin, the play slot, the discard ghost, the drag copy
// and the shop collection (SDD C6/C8).
//
// 13a.9 — favored face: a Weight / Double-Side coin shows its favored face
// (H/T) right after its badge — the same FaceBadge the play row uses for the
// resolved face (glyph first, face color second — colorblind-safe, UX §8).
// The 75/25 value only exists if the player can see which face is favored
// and deliberately collect same-face coins (balance-baseline critical finding).

import type { CoinEffect, CoinEffectKind } from '@/core/types'
import { FaceBadge } from './coin-disc'

/** Short badge labels for coin effects (shown under the coin). */
const EFFECT_LABELS: Record<CoinEffectKind, string> = {
  weight: 'W',
  doubleSide: 'DS',
  chaos: 'C',
  echo: 'E',
  magnetic: 'M',
  reverse: 'R',
  tax: '$',
  jackpot: 'J',
  draw: '↻',
}

/** Badge text for one effect (Draw shows its tier). */
function effectLabel(effect: CoinEffect): string {
  return effect.kind === 'draw' ? `↻${effect.count}` : EFFECT_LABELS[effect.kind]
}

/** The tooltip: the effect name + its favored face (13a.9). */
function effectTitle(effect: CoinEffect): string {
  if (effect.kind === 'weight') return `Weight — 75% chance of ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  if (effect.kind === 'doubleSide') return `Double-Side — always ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  return effect.kind
}

/** Effect badges under a coin (Draw shows its tier; Weight/Double-Side show
 *  their favored face — 13a.9). */
export function CoinBadges({ effects }: { effects: CoinEffect[] }) {
  if (effects.length === 0) return null
  return (
    <span className="coin-badges">
      {effects.map((e) => (
        <span key={e.kind} className="coin-badge-group" title={effectTitle(e)}>
          <span className="coin-badge">{effectLabel(e)}</span>
          {(e.kind === 'weight' || e.kind === 'doubleSide') && <FaceBadge face={e.favored} />}
        </span>
      ))}
    </span>
  )
}
