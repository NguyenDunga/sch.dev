// Offer card (C8) — one of the five shop offers: a charm, a special coin, or
// the hand-size upgrade. Shows the name, a one-line description, and the
// price; the Buy button is disabled when the player is broke or the item is
// unavailable (charm already owned / hand size at cap). The store also
// re-rejects (buyDraft) — the disabled state is just UX feedback.

import { CHARMS, COIN_EFFECTS, HAND_SIZE_CAP, HAND_SIZE_PRICE } from '@/core/shop'
import type { ShopOffer, CoinEffectKind } from '@/core/types'
import { Button } from '@/components/ui/button'
import { ACTION_ICONS } from '@/components/run/action-icons'
import { CHARM_ICONS } from '@/components/charm-bar/charm-icons'
import { EFFECT_ICONS } from '@/components/hand/coin/coin-glyph/effect-icons'
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
  // 13a.8: the affordable state — an unaffordable offer dims (the Buy button
  // is already disabled; the store also re-rejects).
  const poor = !owned && !atCap && cash < price
  const buyDisabled = cash < price || owned || atCap
  // 13c.7 — the offer icon: charm / coin / hand-size. CoinEffectId includes
  // draw1/draw2/draw3 (not a CoinEffectKind) — map them to the draw icon.
  const effectKind = offer.kind === 'coin' ? (offer.effect.startsWith('draw') ? 'draw' : offer.effect) : undefined
  const OfferIcon =
    offer.kind === 'charm'
      ? CHARM_ICONS[offer.charm].icon
      : offer.kind === 'coin'
        ? EFFECT_ICONS[effectKind as CoinEffectKind].icon
        : ACTION_ICONS.handSize.icon

  return (
    <div className={`offer-card offer-card--${offer.kind}${poor ? ' offer-card--poor' : ''}`}>
      <span className="offer-card-name">
        <OfferIcon size={16} strokeWidth={2} aria-hidden className="offer-card-icon" />
        {offerName(offer)}
      </span>
      <span className="offer-card-desc">{offerDescription(offer, handSize)}</span>
      <div className="offer-card-foot">
        <span className={`offer-card-price${poor ? ' offer-card-price--poor' : ''}`}>${price}</span>
        <Button size="sm" disabled={buyDisabled} sfx="buy" onClick={() => onBuy(offer)}>
          {owned ? 'Owned' : atCap ? 'Max' : 'Buy'}
        </Button>
      </div>
    </div>
  )
}
