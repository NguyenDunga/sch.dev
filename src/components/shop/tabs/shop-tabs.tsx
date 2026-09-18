// Shop tabs (13a.14 draft) — the three shop areas: Trade (buy charms /
// coins / hand size — unchanged), Forge (merge two coins), Recycler (sell
// coins for money). One area is visible at a time; the active tab is local
// UI state (no store involvement).

export type ShopTab = 'trade' | 'forge' | 'recycler'

const TABS: Array<{ id: ShopTab; label: string }> = [
  { id: 'trade', label: 'Trade' },
  { id: 'forge', label: 'Forge' },
  { id: 'recycler', label: 'Recycler' },
]

interface ShopTabsProps {
  active: ShopTab
  onChange: (tab: ShopTab) => void
}

export function ShopTabs({ active, onChange }: ShopTabsProps) {
  return (
    <nav className="shop-tabs" aria-label="Shop areas">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`shop-tab${active === t.id ? ' shop-tab--active' : ''}`}
          aria-current={active === t.id ? 'page' : undefined}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
