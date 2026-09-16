// Coin Badges — the small effect icon pills under the coin (layer 4 of 5).
//
// Shows each effect on the coin as a small icon + tooltip. Weight /
// Double-Side also show the favored face badge.
//
// Colorblind-safe (13c.9): the icon shape is the primary signal.

import type { CoinEffect, CoinEffectKind } from '@/core/types'
import { EFFECT_ICONS, FACE_ICONS } from '@/lib/icons'

/** The effect tooltip text (name + description). */
function effectTitle(effect: CoinEffect): string {
  if (effect.kind === 'weight') return `Weight — 75% chance of ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  if (effect.kind === 'doubleSide') return `Double-Side — always ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  return effect.kind
}

/** A single effect badge: icon + tooltip. */
function EffectBadge({ effect }: { effect: CoinEffect }) {
  const def = EFFECT_ICONS[effect.kind as CoinEffectKind]
  const Icon = def.icon
  return (
    <span className="coin-badge" title={effectTitle(effect)}>
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </span>
  )
}

/** A small face badge (H/T) for weight/doubleSide effects. */
function FaceBadge({ face }: { face: 'H' | 'T' }) {
  const def = FACE_ICONS[face]
  const Icon = def.icon
  return (
    <span className={`face-badge face-badge--${face === 'H' ? 'heads' : 'tails'}`} title={def.label}>
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </span>
  )
}

/**
 * Effect badges under a coin.
 * Draw shows its tier; Weight/Double-Side show their favored face.
 */
export function CoinBadges({ effects }: { effects: CoinEffect[] }) {
  if (effects.length === 0) return null
  return (
    <span className="coin-badges">
      {effects.map((e) => (
        <span key={e.kind} className="coin-badge-group" title={effectTitle(e)}>
          <EffectBadge effect={e} />
          {(e.kind === 'weight' || e.kind === 'doubleSide') && <FaceBadge face={e.favored} />}
        </span>
      ))}
    </span>
  )
}
