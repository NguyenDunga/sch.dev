// Coin effect badges (12.3) — the small icon pills under the coin disc that
// show each effect on the coin. Each badge is an icon (13c.4) + a tooltip
// with the full name + description. Weight / Double-Side also show the
// favored face (a face badge, 12.4).
//
// 13c.4: the cryptic single-letter glyphs (W / DS / C / E / M / R / $ / J /
// ↻) are replaced with the registry icons — a consistent, scannable icon
// system. Colorblind-safe (13c.9): the icon shape is the primary signal.

import type { CoinEffect, CoinEffectKind } from '@/core/types'
import { EFFECT_ICONS } from '@/lib/icons'
import { FaceBadge } from './coin-disc'

/** The effect tooltip text (name + description). */
function effectTitle(effect: CoinEffect): string {
  if (effect.kind === 'weight') return `Weight — 75% chance of ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  if (effect.kind === 'doubleSide') return `Double-Side — always ${effect.favored === 'H' ? 'Heads' : 'Tails'}`
  return effect.kind
}

/** The effect badge: a small icon pill + tooltip (13c.4). */
function EffectBadge({ effect }: { effect: CoinEffect }) {
  const def = EFFECT_ICONS[effect.kind as CoinEffectKind]
  const Icon = def.icon
  return (
    <span className="coin-badge" title={effectTitle(effect)}>
      <Icon size={12} strokeWidth={2.5} aria-hidden />
    </span>
  )
}

/** Effect badges under a coin (Draw shows its tier; Weight/Double-Side show
 *  their favored face — 13a.9). */
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
