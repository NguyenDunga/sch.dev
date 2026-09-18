// Deck panel (13a.14 draft) — the read-only deck view, opened by the small
// coin icon in the shop header (shop-only). Shows every owned coin (draw
// pile + discard pile). Merging lives in the Forge, selling in the Recycler —
// so the panel has no actions.

import { Coin as CoinVisual } from '@/components/hand/coin'
import { Button } from '@/components/ui/button'
import type { Coin } from '@/core/types'

interface DeckPanelProps {
  coins: Coin[]
  onClose: () => void
}

export function DeckPanel({ coins, onClose }: DeckPanelProps) {
  return (
    <div className="deck-panel" role="dialog" aria-label="Your deck">
      <header className="deck-head">
        <h2 className="deck-title">Your deck</h2>
        <span className="deck-count">{coins.length} coins</span>
        <Button size="xs" variant="outline" onClick={onClose}>
          Close
        </Button>
      </header>
      {coins.length === 0 ? (
        <p className="deck-empty">No coins in the collection</p>
      ) : (
        <ul className="deck-list">
          {coins.map((coin) => (
            <li key={coin.id} className="deck-item">
              <CoinVisual face={undefined} effects={coin.effects} size="md" />
            </li>
          ))}
        </ul>
      )}
      <p className="deck-note">Merge in the Forge · Sell in the Recycler</p>
    </div>
  )
}
