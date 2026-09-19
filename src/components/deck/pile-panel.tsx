// Pile panel — the shared read-only pile view (the deck + the discard well).
// Shows every coin in the pile (face-down discs, hover for the effect info).
// No actions: merging lives in the Forge, selling in the Recycler.

import { Coin as CoinVisual } from '@/components/hand/coin'
import { useInfoHover } from '@/components/hand/coin/coin-info/coin-info-context'
import { effectRows } from '@/lib/effect-info'
import { Button } from '@/components/ui/button'
import type { Coin } from '@/core/types'

interface PilePanelProps {
  title: string
  coins: Coin[]
  /** Shown when the pile is empty (default: "Empty"). */
  emptyText?: string
  /** Footer note (e.g. the deck's Forge/Recycler hint). */
  note?: string
  onClose: () => void
}

/** One pile coin (a child so the hover hook stays per-coin). */
function PileCoin({ coin }: { coin: Coin }) {
  const coinHover = useInfoHover(effectRows(coin.effects), 'Coin effects')
  return (
    <li className="deck-item" onMouseOver={coinHover.onMouseOver} onMouseOut={coinHover.onMouseOut}>
      <CoinVisual face={undefined} effects={coin.effects} size="md" />
    </li>
  )
}

export function PilePanel({ title, coins, emptyText = 'Empty', note, onClose }: PilePanelProps) {
  return (
    <div className="deck-panel" role="dialog" aria-label={title}>
      <header className="deck-head">
        <h2 className="deck-title">{title}</h2>
        <span className="deck-count">{coins.length} coins</span>
        <Button size="xs" variant="outline" onClick={onClose}>
          Close
        </Button>
      </header>
      {coins.length === 0 ? (
        <p className="deck-empty">{emptyText}</p>
      ) : (
        <ul className="deck-list">
          {coins.map((coin) => (
            <PileCoin key={coin.id} coin={coin} />
          ))}
        </ul>
      )}
      {note && <p className="deck-note">{note}</p>}
    </div>
  )
}
