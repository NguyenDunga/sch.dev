// Effect badges shown under a coin (the 9 effects; Draw shows its tier).
// Shared by the hand coin and the play slot (SDD C6).

import type { CoinEffect, CoinEffectKind } from '@/core/types'

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

/** Effect badges under a coin (Draw shows its tier). */
export function CoinBadges({ effects }: { effects: CoinEffect[] }) {
  if (effects.length === 0) return null
  return (
    <span className="coin-badges">
      {effects.map((e) => (
        <span key={e.kind} className="coin-badge" title={e.kind}>
          {effectLabel(e)}
        </span>
      ))}
    </span>
  )
}
