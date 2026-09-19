// Trade — the unified offer grid (charms / coins / hand size as inventory
// tiles; hover a tile for its detail) + the owned-charm bar. The grid is the
// scroll region; the area-head title and the charm bar stay fixed (see the
// SCROLL ARCHITECTURE note in shop.css).

import { useRunStore } from '@/state/runStore'
import { CharmBar } from '@/components/charm-bar/charm-bar'
import { OffersGrid } from '@/components/shop/offer/offer-grid'

export function TradeArea() {
  const offers = useRunStore((s) => s.shop.offers)
  const cash = useRunStore((s) => s.cash)
  const charms = useRunStore((s) => s.charms)
  const handSize = useRunStore((s) => s.handSize)
  const buy = useRunStore((s) => s.buy)

  return (
    <section className="trade" aria-label="Trade">
      <header className="area-head">
        <h2 className="area-title">Trade</h2>
      </header>
      <div className="offer-scroll">
        <OffersGrid offers={offers} cash={cash} charms={charms} handSize={handSize} onBuy={buy} />
      </div>
      <CharmBar />
    </section>
  )
}
