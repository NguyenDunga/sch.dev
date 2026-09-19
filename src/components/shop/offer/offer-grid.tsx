// OffersGrid — the unified shop-offer grid (M20.2). Every offer (charm / coin /
// hand size) is an inventory-style tile: an icon disc + its price, with NO
// inline detail — hover the tile for the detail panel (the coin-info system,
// now generic over coins + charms + hand size). The whole tile is the buy
// button. Replaces the old per-kind offer rows (offer-card).

import { coinPrice } from '@/config/coins'
import { CHARMS } from '@/config/charms'
import { catalogRow, charmRows, type InfoRow } from '@/lib/effect-info'
import { useInfoHover } from '@/components/hand/coin/coin-info/coin-info-context'
import { ACTION_ICONS } from '@/components/run/action-icons'
import { Button } from '@/components/ui/button'
import { HAND_SIZE_CAP, HAND_SIZE_PRICE } from '@/core/shop'
import type { CharmId, ShopOffer } from '@/core/types'

/** The detail rows for an offer (what the hover panel shows). */
function offerRows(offer: ShopOffer, handSize: number): InfoRow[] {
  if (offer.kind === 'coin') return [catalogRow(offer.effect)]
  if (offer.kind === 'charm') return charmRows(offer.charm)
  return [
    {
      icon: ACTION_ICONS.handSize.icon,
      name: 'Hand Size +1',
      blurb: `Draw ${handSize + 1} coins per hand (max ${HAND_SIZE_CAP}).`,
    },
  ]
}

/** The hover panel's title for an offer. */
function offerTitle(offer: ShopOffer): string {
  if (offer.kind === 'coin') return 'Coin effects'
  if (offer.kind === 'charm') return 'Charm'
  return 'Hand size'
}

function offerPrice(offer: ShopOffer): number {
  if (offer.kind === 'coin') return coinPrice(offer.effect)
  if (offer.kind === 'charm') return CHARMS[offer.charm].price
  return HAND_SIZE_PRICE
}

interface OfferTileProps {
  offer: ShopOffer
  cash: number
  charms: CharmId[]
  handSize: number
  onBuy: (offer: ShopOffer) => void
}

/** One offer tile: icon disc · title · price · Buy (hover → detail). */
function OfferTile({ offer, cash, charms, handSize, onBuy }: OfferTileProps) {
  const rows = offerRows(offer, handSize)
  const hover = useInfoHover(rows, offerTitle(offer))
  const price = offerPrice(offer)
  const owned = offer.kind === 'charm' && charms.includes(offer.charm)
  const atCap = offer.kind === 'handSize' && handSize >= HAND_SIZE_CAP
  const poor = !owned && !atCap && cash < price
  const disabled = cash < price || owned || atCap
  const Icon = rows[0].icon
  const name = rows[0].name
  return (
    <div
      className={`offer-tile offer-tile--${offer.kind}${poor ? ' offer-tile--poor' : ''}`}
      onMouseOver={hover.onMouseOver}
      onMouseOut={hover.onMouseOut}
    >
      <span className="offer-tile-visual" aria-hidden>
        <Icon size={22} strokeWidth={2} />
      </span>
      <span className="offer-tile-name">{name}</span>
      <span className="offer-tile-price">${price}</span>
      <Button className="offer-tile-buy" size="sm" disabled={disabled} onClick={() => onBuy(offer)} aria-label={`Buy ${name}`}>
        Buy
      </Button>
      {owned && <span className="offer-tile-badge">Owned</span>}
      {atCap && <span className="offer-tile-badge">Max</span>}
    </div>
  )
}

interface OffersGridProps {
  offers: ShopOffer[]
  cash: number
  charms: CharmId[]
  handSize: number
  onBuy: (offer: ShopOffer) => void
}

/** A stable key per offer (the offers array is fixed-length per shop visit). */
function offerKey(offer: ShopOffer): string {
  if (offer.kind === 'charm') return `charm-${offer.charm}`
  if (offer.kind === 'coin') return `coin-${offer.effect}`
  return 'hand-size'
}

export function OffersGrid({ offers, cash, charms, handSize, onBuy }: OffersGridProps) {
  return (
    <div className="offer-grid">
      {offers.map((offer) => (
        <OfferTile key={offerKey(offer)} offer={offer} cash={cash} charms={charms} handSize={handSize} onBuy={onBuy} />
      ))}
    </div>
  )
}
