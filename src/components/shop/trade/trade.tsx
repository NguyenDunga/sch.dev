// Trade area (13a.14) — the shop's buying area: the five offers grouped by
// kind (charms / coins / hand size) + the charm bar. Unchanged from 13a.8.

import { useRunStore } from '@/state/runStore'
import type { ShopOffer } from '@/core/types'
import { OfferCard } from '@/components/shop/offer/offer-card'
import { CharmBar } from '@/components/charm-bar/charm-bar'

/** A stable key for an offer (no duplicates within one shop). */
function offerKey(o: ShopOffer): string {
  if (o.kind === 'charm') return `charm-${o.charm}`
  if (o.kind === 'coin') return `coin-${o.effect}`
  return 'handSize'
}

/** 13a.8: the offer sections, in kind order (charm / coin / hand size);
 *  empty kinds are dropped. */
const OFFER_SECTIONS: Array<{ kind: ShopOffer['kind']; label: string }> = [
  { kind: 'charm', label: 'Charms' },
  { kind: 'coin', label: 'Coins' },
  { kind: 'handSize', label: 'Hand size' },
]

function groupOffers(offers: ShopOffer[]): Array<{ kind: ShopOffer['kind']; label: string; offers: ShopOffer[] }> {
  return OFFER_SECTIONS.map((s) => ({ ...s, offers: offers.filter((o) => o.kind === s.kind) })).filter(
    (s) => s.offers.length > 0,
  )
}

export function TradeArea() {
  const offers = useRunStore((s) => s.shop.offers)
  const cash = useRunStore((s) => s.cash)
  const charms = useRunStore((s) => s.charms)
  const handSize = useRunStore((s) => s.handSize)
  const buy = useRunStore((s) => s.buy)

  return (
    <div className="trade">
      {/* 13a.8: the offers, grouped by kind (category color per card). */}
      {groupOffers(offers).map((section) => (
        <section key={section.kind} className="offer-section" aria-label={section.label}>
          <h2 className="offer-section-label">{section.label}</h2>
          <div className="offer-grid">
            {section.offers.map((offer) => (
              <OfferCard
                key={offerKey(offer)}
                offer={offer}
                cash={cash}
                charms={charms}
                handSize={handSize}
                onBuy={buy}
              />
            ))}
          </div>
        </section>
      ))}

      <CharmBar />
    </div>
  )
}
