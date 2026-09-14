// Offer card (C8) — one of the five shop offers: a charm, a special coin, or
// the hand-size upgrade. Shows the name, a one-line description, and the
// price; the Buy button is disabled when the player is broke or the item is
// unavailable (charm already owned / hand size at cap). The store also
// re-rejects (buyDraft) — the disabled state is just UX feedback.

import { CHARMS, COIN_EFFECTS, HAND_SIZE_CAP, HAND_SIZE_PRICE } from '@/core/balance'
import type { ShopOffer } from '@/core/types'
import { Button } from '@/components/ui/button'
import { CHARM_DESCRIPTIONS, COIN_DESCRIPTIONS } from './descriptions'

interface OfferCardProps {
  offer: ShopOffer
  cash: number
  charms: string[]
  handSize: number
  onBuy: (offer: ShopOffer) => void
}

/** The offer's price (charm / coin / hand-size). */
function offerPrice(offer: ShopOffer): number {
  if (offer.kind === 'charm') return CHARMS.find((c) => c.id === offer.charm)?.price ?? 0
  if (offer.kind === 'coin') return COIN_EFFECTS.find((c) => c.effect === offer.effect)?.price ?? 0
  return HAND_SIZE_PRICE
}

/** The offer's display name. */
function offerName(offer: ShopOffer): string {
  if (offer.kind === 'charm') return CHARMS.find((c) => c.id === offer.charm)?.name ?? offer.charm
  if (offer.kind === 'coin') return COIN_EFFECTS.find((c) => c.effect === offer.effect)?.name ?? offer.effect
  return 'Hand Size +1'
}

/** The offer's one-line description. */
function offerDescription(offer: ShopOffer, handSize: number): string {
  if (offer.kind === 'charm') return CHARM_DESCRIPTIONS[offer.charm]
  if (offer.kind === 'coin') return COIN_DESCRIPTIONS[offer.effect]
  return `Draw ${handSize + 1} coins per hand (max ${HAND_SIZE_CAP})`
}

export function OfferCard({ offer, cash, charms, handSize, onBuy }: OfferCardProps) {
  const price = offerPrice(offer)
  const owned = offer.kind === 'charm' && charms.includes(offer.charm)
  const atCap = offer.kind === 'handSize' && handSize >= HAND_SIZE_CAP
  const disabled = cash < price || owned || atCap

  return (
    <div className={`offer-card offer-card--${offer.kind}`}>
      <span className="offer-card-name">{offerName(offer)}</span>
      <span className="offer-card-desc">{offerDescription(offer, handSize)}</span>
      <div className="offer-card-foot">
        <span className="offer-card-price">${price}</span>
        <Button size="sm" disabled={disabled} onClick={() => onBuy(offer)}>
          {owned ? 'Owned' : atCap ? 'Max' : 'Buy'}
        </Button>
      </div>
    </div>
  )
}
