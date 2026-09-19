// Charms tab — every charm: icon, name, category, blurb, price. Built from
// the charm registry (src/config/charms), so a new charm shows up here
// automatically (the registry is compiler-enforced).

import { CHARM_CATALOG, CHARMS, charmBlurb } from '@/config/charms'

export function CharmsTab() {
  return (
    <ul className="wiki-list">
      {CHARM_CATALOG.map((charm) => {
        const Icon = CHARMS[charm.id].icon.icon
        return (
          <li key={charm.id} className="wiki-item">
            <Icon size={16} aria-hidden className="wiki-item-icon" />
            <div className="wiki-item-body">
              <p className="wiki-item-name">
                {charm.name} <span className="wiki-item-price">${charm.price}</span>
              </p>
              <p className="wiki-item-blurb">
                {charm.category} · {charmBlurb(charm.id)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
