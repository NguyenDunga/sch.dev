// Bosses tab — the boss rules, straight from the BOSS_RULES balance table.
// Adding a rule to BOSS_RULES shows up here automatically (no per-rule UI).

import { BOSS_RULES } from '@/core/balance'

export function BossesTab() {
  return (
    <ul className="wiki-list">
      {BOSS_RULES.map((rule) => (
        <li key={rule.id} className="wiki-item">
          <div className="wiki-item-body">
            <p className="wiki-item-name">{rule.name}</p>
            <p className="wiki-item-blurb">{rule.description}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
