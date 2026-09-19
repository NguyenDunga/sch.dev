// Coins tab — every coin effect: icon, name, blurb, shop price. Built from
// the coin registry (src/config/coins), so a new coin shows up here
// automatically (the registry is compiler-enforced).

import { COIN_CATALOG, COIN_EFFECTS } from '@/config/coins'
import { catalogEntry } from '@/lib/effect-info'

export function CoinsTab() {
  return (
    <ul className="wiki-list">
      {COIN_CATALOG.map((def) => {
        const entry = catalogEntry(def.effect)
        const Icon = COIN_EFFECTS[entry.kind].icon.icon
        return (
          <li key={def.effect} className="wiki-item">
            <Icon size={16} aria-hidden className="wiki-item-icon" />
            <div className="wiki-item-body">
              <p className="wiki-item-name">
                {def.name} <span className="wiki-item-price">${def.price}</span>
              </p>
              <p className="wiki-item-blurb">{entry.blurb}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
