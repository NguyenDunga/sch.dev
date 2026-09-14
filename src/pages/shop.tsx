// C8 — Shop screen: the five offers (charms / special coins / hand-size
// upgrade), the free reroll, the charm bar (C7), and the collection (all
// owned coins with Merge + Remove). Reads RunState; dispatches the store shop
// actions. Leave advances to the next blind (leaveShop, M10).

import { useRunStore } from '@/state/runStore'
import type { ShopOffer } from '@/core/types'
import { OfferCard } from '@/components/shop/offer-card'
import { Collection } from '@/components/shop/collection'
import { CharmBar } from '@/components/charm-bar/charm-bar'
import { Button } from '@/components/ui/button'

/** A stable key for an offer (no duplicates within one shop). */
function offerKey(o: ShopOffer): string {
  if (o.kind === 'charm') return `charm-${o.charm}`
  if (o.kind === 'coin') return `coin-${o.effect}`
  return 'handSize'
}

export function ShopScreen() {
  const offers = useRunStore((s) => s.shop.offers)
  const rerollUsed = useRunStore((s) => s.shop.rerollUsed)
  const cash = useRunStore((s) => s.cash)
  const charms = useRunStore((s) => s.charms)
  const handSize = useRunStore((s) => s.handSize)
  const drawPile = useRunStore((s) => s.deck.drawPile)
  const discardPile = useRunStore((s) => s.deck.discardPile)
  const buy = useRunStore((s) => s.buy)
  const reroll = useRunStore((s) => s.reroll)
  const leaveShop = useRunStore((s) => s.leaveShop)

  const collection = [...drawPile, ...discardPile]

  return (
    <main className="shop-screen">
      <header className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <span className="shop-cash">${cash}</span>
        <Button variant="outline" size="lg" disabled={rerollUsed} onClick={reroll}>
          {rerollUsed ? 'Rerolled' : 'Reroll'}
        </Button>
      </header>

      <div className="offer-grid">
        {offers.map((offer) => (
          <OfferCard key={offerKey(offer)} offer={offer} cash={cash} charms={charms} handSize={handSize} onBuy={buy} />
        ))}
      </div>

      <CharmBar />

      <Collection coins={collection} />

      <footer className="shop-footer">
        <Button size="xl" pulse onClick={leaveShop}>
          Leave
        </Button>
      </footer>
    </main>
  )
}
