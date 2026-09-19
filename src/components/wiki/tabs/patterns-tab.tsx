// Patterns tab — the scoring tiers (highest priority wins), straight from
// the TIERS balance table + a human pattern description per tier id. Adding
// a tier to TIERS requires a TIER_PATTERNS entry (Record type).

import { TIERS } from '@/core/balance'
import type { TierId } from '@/core/types'

/** The human pattern per tier (the TIERS table only carries name + numbers). */
const TIER_PATTERNS: Record<TierId, string> = {
  jackpot: '5 identical faces',
  fourRow: '4 adjacent identical faces',
  alternating: '5 strictly alternating (HTHTH / THTHT)',
  fourSame: '4 of a face (any position)',
  tripleRun: '3 adjacent identical faces',
  threeSame: '3 of a face (any position)',
}

export function PatternsTab() {
  return (
    <div className="wiki-section">
      <table className="wiki-table">
        <thead>
          <tr>
            <th>Pattern</th>
            <th>Shape</th>
            <th>Chips</th>
            <th>Mult</th>
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => (
            <tr key={tier.id}>
              <td>{tier.name}</td>
              <td>{TIER_PATTERNS[tier.id]}</td>
              <td>{tier.chips}</td>
              <td>{tier.mult}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="wiki-note">
        Highest tier wins. Empty play slots count as nothing — a k-coin play can only match tiers that fit in k.
        Boss rules can disable or demote tiers.
      </p>
    </div>
  )
}
