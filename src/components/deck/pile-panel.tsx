// Pile panel — the shared read-only pile view (the deck + the discard well).
// Shows every coin in the pile (face-down discs, hover for the effect info).
// No actions: merging lives in the Forge, selling in the Recycler.
//
// M23.9 — rendered in the unified shadcn Dialog (ui/dialog.tsx): portal +
// backdrop, Esc / overlay-click close, focus trap, bottom sheet on phone /
// centered panel on md+. Both pile dialogs (draw pile, discard pile) use it.

import { Coin as CoinVisual } from '@/components/hand/coin'
import { useInfoHover } from '@/components/hand/coin/coin-info/coin-info-context'
import { effectRows } from '@/lib/effect-info'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
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
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent
        className="deck-panel-shell p-0"
        overlayClassName="z-[70]"
        onOverlayClick={onClose}
        showCloseButton={false}
        aria-label={title}
      >
        <div className="deck-panel h-full w-full md:h-auto md:w-[46rem] md:max-h-[calc(100dvh-4rem)] md:max-w-full">
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
      </DialogContent>
    </Dialog>
  )
}
