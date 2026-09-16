// Collection (C8, 13a.8) — the deck the player is building: every owned coin
// (draw pile + discard pile), shown first and prominent — the shop's visual
// anchor. Each tile shows the coin disc + its effect badges, with Merge and
// Remove ($1) actions.
//
// Merge: drag one coin onto another (dnd-kit) — the two-step tap flow
// (tap "Merge" on the source, then "Merge into" on the target; "Cancel"
// clears) remains as the no-pointer / keyboard fallback. Both paths call the
// same store `mergeCoin` (UX §0).

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useState } from 'react'
import { REMOVE_COIN_COST } from '@/core/balance'
import type { Coin } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { CoinBadges } from '@/components/hand/coin-badges'
import { CoinDisc } from '@/components/hand/coin-disc'
import { Button } from '@/components/ui/button'

interface CollectionProps {
  coins: Coin[]
}

export function Collection({ coins }: CollectionProps) {
  const cash = useRunStore((s) => s.cash)
  const mergeCoin = useRunStore((s) => s.mergeCoin)
  const removeCoin = useRunStore((s) => s.removeCoin)
  // The merge source (a coin id), or null when no tap-merge is in progress.
  const [mergeSource, setMergeSource] = useState<number | null>(null)
  // The coin id currently being dragged (the overlay copy).
  const [dragId, setDragId] = useState<number | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (e: DragStartEvent) => setDragId(Number(String(e.active.id)))
  const onDragEnd = (e: DragEndEvent) => {
    const from = Number(String(e.active.id))
    setDragId(null)
    if (!e.over) return
    const to = Number(String(e.over.id))
    if (to !== from) mergeCoin(from, to) // the store re-validates (UX §0)
  }

  const startMerge = (id: number) => setMergeSource(id)
  const cancelMerge = () => setMergeSource(null)
  const completeMerge = (targetId: number) => {
    if (mergeSource !== null && mergeSource !== targetId) mergeCoin(mergeSource, targetId)
    setMergeSource(null)
  }

  if (coins.length === 0) {
    return (
      <section className="collection collection--empty" aria-label="Your deck">
        No coins in the collection
      </section>
    )
  }

  const dragCoin = dragId !== null ? coins.find((c) => c.id === dragId) : undefined

  return (
    <section className="collection" aria-label="Your deck">
      <header className="collection-head">
        <h2 className="collection-title">Your deck</h2>
        <span className="collection-count">{coins.length} coins</span>
      </header>
      {mergeSource !== null && (
        <p className="collection-hint">
          Merging <strong>into</strong> a coin — pick a target, or cancel.
        </p>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setDragId(null)}
      >
        <ul className="collection-list">
          {coins.map((coin) => (
            <MergeTile
              key={coin.id}
              coin={coin}
              cash={cash}
              isSource={mergeSource === coin.id}
              merging={mergeSource !== null}
              onMerge={() => (mergeSource === null ? startMerge(coin.id) : completeMerge(coin.id))}
              onCancel={cancelMerge}
              onRemove={() => removeCoin(coin.id)}
            />
          ))}
        </ul>
        <DragOverlay dropAnimation={null}>
          {dragCoin ? (
            <li className="collection-item collection-item--drag">
              <span className="collection-item-disc">
                <CoinDisc face={undefined} />
              </span>
              <CoinBadges effects={dragCoin.effects} />
            </li>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  )
}

interface MergeTileProps {
  coin: Coin
  cash: number
  isSource: boolean
  merging: boolean
  onMerge: () => void
  onCancel: () => void
  onRemove: () => void
}

/** One collection tile: a drag handle (the disc) + badges + the actions.
 *  The whole tile is a drop target; the handle is the drag source (so the
 *  buttons stay plain buttons — the tap merge is the keyboard path). */
function MergeTile({ coin, cash, isSource, merging, onMerge, onCancel, onRemove }: MergeTileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: coin.id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: coin.id })

  return (
    <li
      ref={setDropRef}
      className={[
        'collection-item',
        isSource ? 'collection-item--source' : '',
        isOver && !isDragging ? 'collection-item--over' : '',
        isDragging ? 'collection-item--dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span
        ref={setNodeRef}
        className="collection-item-handle"
        aria-label={`Coin with ${coin.effects.length} effect${coin.effects.length === 1 ? '' : 's'}: drag onto another coin to merge`}
        {...attributes}
        {...listeners}
      >
        <span className="collection-item-disc">
          <CoinDisc face={undefined} />
        </span>
      </span>
      <CoinBadges effects={coin.effects} />
      <div className="collection-item-actions">
        {isSource ? (
          <Button size="xs" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button size="xs" variant="outline" onClick={onMerge}>
            {merging ? 'Merge into' : 'Merge'}
          </Button>
        )}
        <Button size="xs" variant="destructive" disabled={cash < REMOVE_COIN_COST} onClick={onRemove}>
          Remove ${REMOVE_COIN_COST}
        </Button>
      </div>
    </li>
  )
}
