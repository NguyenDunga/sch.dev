// 13.1 — the face-down hand row: tappable coins (pick), draggable to the
// play row (13a.5) or the discard well (13a.6), multi-selectable.

import { DraggableHandCoin } from '@/components/hand/coin-dnd'
import type { Hand } from '@/core/types'
import type { CoinSelection } from '@/components/hand/coin-dnd'

export interface HandRowProps {
  hand: Hand
  canPick: boolean
  shake: { id: number; n: number } | null
  deals: Map<number, number>
  selection: CoinSelection
  onPick: (i: number) => void
  /** 13a.6: per-coin discard control (the D key while the coin is focused). */
  onDiscard: (i: number, el: HTMLElement) => void
  onToggleSelect: (i: number) => void
  onRangeSelect: (i: number) => void
  /** 13a.5: double-click quick-play (caught on the row — the coin moves away). */
  onQuickPlay: () => void
  registerRef: (i: number, el: HTMLButtonElement | null) => void
}

export function HandRow({
  hand,
  canPick,
  shake,
  deals,
  selection,
  onPick,
  onDiscard,
  onToggleSelect,
  onRangeSelect,
  onQuickPlay,
  registerRef,
}: HandRowProps) {
  return (
    <div className="hand-zone">
      <div className="hand-row" onDoubleClick={onQuickPlay}>
        {hand.map((slot, i) =>
          slot.kind === 'filled' ? (
            <DraggableHandCoin
              key={slot.coin.id}
              coin={slot.coin}
              index={i}
              enabled={canPick}
              shaking={shake?.id === slot.coin.id}
              shakeKey={shake?.n ?? 0}
              dealIndex={deals.get(slot.coin.id)}
              selected={selection.isSelected(i)}
              onPick={() => onPick(i)}
              onDiscard={(el) => onDiscard(i, el)}
              onToggleSelect={() => onToggleSelect(i)}
              onRangeSelect={() => onRangeSelect(i)}
              registerRef={(el) => registerRef(i, el)}
            />
          ) : (
            <div key={`empty-${i}`} className="hand-slot--empty" aria-hidden />
          ),
        )}
      </div>
    </div>
  )
}
