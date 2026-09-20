// Tier reference (M22) — a compact panel on the run screen listing each
// tier's current chips × mult (base + purchased upgrades), so the player
// sees their pattern-upgrade investment at a glance. Upgraded tiers are
// highlighted. Static (no animation — reduced-motion safe).

import { TIERS } from '@/core/balance'
import { useRunStore } from '@/state/runStore'
import { TIER_ICONS } from '@/components/juice/choreo/beats/tier-icons'

export function TierReference() {
  const tierUpgrades = useRunStore((s) => s.tierUpgrades)
  return (
    <div
      className="tier-reference lg:justify-start lg:justify-self-start landscape-short:flex-nowrap landscape-short:overflow-x-auto landscape-short:justify-start"
      role="group"
      aria-label="Tier values"
    >
      {TIERS.map((tier) => {
        const up = tierUpgrades[tier.id]
        const upgraded = up.chips > 0 || up.mult > 0
        const Icon = TIER_ICONS[tier.id].icon
        return (
          <span
            key={tier.id}
            className={`tier-ref tier-ref--${tier.id}${upgraded ? ' tier-ref--upgraded' : ''}`}
            title={`${tier.name}: ${tier.chips + up.chips} chips × ${tier.mult + up.mult} mult`}
          >
            <Icon size={12} strokeWidth={2.5} aria-hidden />
            <span className="tier-ref-value">
              {tier.chips + up.chips}×{tier.mult + up.mult}
            </span>
          </span>
        )
      })}
    </div>
  )
}
