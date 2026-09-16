// C8 — Shop screen (13a.8 layout): the coin collection first and prominent
// (the deck the player is building — the visual anchor), then the five offers
// grouped by kind (charms / coins / hand size), the charm bar (C7), and a
// fixed footer with the Reroll ("free, once") + Leave primary actions (Leave
// nudges when cash is unspent). Reads RunState; dispatches the store shop
// actions (UX §0).

import { useRunStore } from '@/state/runStore'
import { BLINDS, HEAVY_TARGET_BONUS, PAYDAY_BONUS } from '@/core/balance'
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

export function ShopScreen() {
  const offers = useRunStore((s) => s.shop.offers)
  const rerollUsed = useRunStore((s) => s.shop.rerollUsed)
  const cash = useRunStore((s) => s.cash)
  const charms = useRunStore((s) => s.charms)
  const handSize = useRunStore((s) => s.handSize)
  const drawPile = useRunStore((s) => s.deck.drawPile)
  const discardPile = useRunStore((s) => s.deck.discardPile)
  const blindIndex = useRunStore((s) => s.blindIndex)
  const earlyClearBonus = useRunStore((s) => s.earlyClearBonus)
  const handsLeft = useRunStore((s) => s.handsLeft)
  const buy = useRunStore((s) => s.buy)
  const reroll = useRunStore((s) => s.reroll)
  const leaveShop = useRunStore((s) => s.leaveShop)

  const collection = [...drawPile, ...discardPile]
  const blind = BLINDS[blindIndex]
  const isHeavy = blind.kind === 'boss' && blind.rule === 'heavyTarget'
  const reward =
    blind.reward + (charms.includes('payday') ? PAYDAY_BONUS : 0) + (isHeavy ? HEAVY_TARGET_BONUS : 0)

  return (
    <main className="shop-screen">
      <header className="shop-header">
        <h1 className="shop-title">Shop</h1>
        <span className="shop-cash">${cash}</span>
      </header>

      {/* 13a.4: the blind-clear reward breakdown (early-clear bonus when the
          target was met before the hand budget ran out). */}
      <p className="shop-reward" role="status">
        Blind cleared! +${reward}
        {earlyClearBonus > 0 && (
          <span className="shop-reward-bonus">
            {' '}+${earlyClearBonus} early-clear ({handsLeft} unused hand{handsLeft > 1 ? 's' : ''})
          </span>
        )}
      </p>

      {/* 13a.8: the collection is the visual anchor — the deck the player is
          building (merge by drag, remove $1). */}
      <Collection coins={collection} />

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

      {/* 13a.8: fixed primary actions — Reroll (free, once) + Leave (nudges
          when cash is unspent; it carries over to the next blind). */}
      <footer className="shop-footer">
        {cash > 0 && (
          <p className="shop-footer-nudge" role="status">
            Leaving with ${cash} — it carries over
          </p>
        )}
        <div className="shop-footer-actions">
          <Button variant="outline" size="lg" disabled={rerollUsed} sfx="reroll" onClick={reroll}>
            {rerollUsed ? 'Rerolled' : 'Reroll (free, once)'}
          </Button>
          <Button size="xl" pulse onClick={leaveShop}>
            Leave
          </Button>
        </div>
      </footer>
    </main>
  )
}
