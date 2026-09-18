// C8 — Shop screen (13a.14): the three shop areas (Trade / Forge / Recycler)
// as tabs, the deck behind a small header icon (shop-only, read-only), and
// the fixed footer (Reroll + Leave).
//
// A thin orchestrator (like RunScreen): the areas live in components/shop
// (tabs / trade / forge / recycler / deck), the store actions in
// state/shopActions, and the shop data in core/shop (UX §0).

import { useState } from 'react'
import { useRunStore } from '@/state/runStore'
import { BLINDS, HEAVY_TARGET_BONUS, PAYDAY_BONUS } from '@/core/balance'
import { Coin as CoinVisual } from '@/components/hand/coin'
import { ShopTabs } from '@/components/shop/tabs/shop-tabs'
import type { ShopTab } from '@/components/shop/tabs/shop-tabs'
import { TradeArea } from '@/components/shop/trade/trade'
import { Forge } from '@/components/shop/forge/forge'
import { Recycler } from '@/components/shop/recycler/recycler'
import { DeckPanel } from '@/components/shop/deck/deck-panel'
import { Button } from '@/components/ui/button'

/** The top bar: deck icon (toggles the deck panel) + title + cash. */
function ShopHeader({
  cash,
  deckOpen,
  onToggleDeck,
}: {
  cash: number
  deckOpen: boolean
  onToggleDeck: () => void
}) {
  return (
    <header className="shop-header">
      {/* 13a.14: the deck lives behind a small icon (shop-only, read-only). */}
      <button
        type="button"
        className="shop-deck-icon"
        aria-label="Show deck"
        aria-expanded={deckOpen}
        onClick={onToggleDeck}
      >
        <CoinVisual face={undefined} effects={[]} size={28} />
      </button>
      <h1 className="shop-title">Shop</h1>
      <span className="shop-cash">${cash}</span>
    </header>
  )
}

/** 13a.4: the blind-clear reward breakdown (early-clear bonus when the
 *  target was met before the hand budget ran out). */
function RewardLine() {
  const blindIndex = useRunStore((s) => s.blindIndex)
  const charms = useRunStore((s) => s.charms)
  const earlyClearBonus = useRunStore((s) => s.earlyClearBonus)
  const handsLeft = useRunStore((s) => s.handsLeft)
  const blind = BLINDS[blindIndex]
  const isHeavy = blind.kind === 'boss' && blind.rule === 'heavyTarget'
  const reward =
    blind.reward + (charms.includes('payday') ? PAYDAY_BONUS : 0) + (isHeavy ? HEAVY_TARGET_BONUS : 0)

  return (
    <p className="shop-reward" role="status">
      Blind cleared! +${reward}
      {earlyClearBonus > 0 && (
        <span className="shop-reward-bonus">
          {' '}+${earlyClearBonus} early-clear ({handsLeft} unused hand{handsLeft > 1 ? 's' : ''})
        </span>
      )}
    </p>
  )
}

/** 13a.8: fixed primary actions — Reroll (free, once) + Leave (nudges when
 *  cash is unspent; it carries over to the next blind). */
function ShopFooter() {
  const cash = useRunStore((s) => s.cash)
  const rerollUsed = useRunStore((s) => s.shop.rerollUsed)
  const reroll = useRunStore((s) => s.reroll)
  const leaveShop = useRunStore((s) => s.leaveShop)

  return (
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
  )
}

export function ShopScreen() {
  const cash = useRunStore((s) => s.cash)
  const drawPile = useRunStore((s) => s.deck.drawPile)
  const discardPile = useRunStore((s) => s.deck.discardPile)
  // 13a.14: the active area (local UI state) + the deck panel (behind the
  // header icon).
  const [tab, setTab] = useState<ShopTab>('trade')
  const [deckOpen, setDeckOpen] = useState(false)

  const collection = [...drawPile, ...discardPile]

  return (
    <main className="shop-screen">
      <ShopHeader cash={cash} deckOpen={deckOpen} onToggleDeck={() => setDeckOpen((v) => !v)} />
      <RewardLine />
      {/* 13a.14: the three shop areas, one visible at a time. */}
      <ShopTabs active={tab} onChange={setTab} />
      <div className="shop-tab-panel">
        {tab === 'trade' && <TradeArea />}
        {tab === 'forge' && <Forge coins={collection} />}
        {tab === 'recycler' && <Recycler coins={collection} />}
      </div>
      <ShopFooter />
      {deckOpen && <DeckPanel coins={collection} onClose={() => setDeckOpen(false)} />}
    </main>
  )
}
