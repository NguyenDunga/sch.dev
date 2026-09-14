// Collection (C8) — every owned coin (draw pile + discard pile) with its
// effects, plus the Merge (pick a source, then a target — effects stack, free)
// and Remove (delete a coin, $1) actions.
//
// Merge is a two-step selection (local UI state): tap "Merge" on a coin to
// make it the source (highlighted), then "Merge into" on another coin to fold
// the source's effects into it (the source is removed). "Cancel" clears it.

import { useState } from 'react'
import { REMOVE_COIN_COST } from '@/core/balance'
import type { Coin } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { CoinBadges } from '@/components/hand/coin-badges'
import { Button } from '@/components/ui/button'

interface CollectionProps {
  coins: Coin[]
}

export function Collection({ coins }: CollectionProps) {
  const cash = useRunStore((s) => s.cash)
  const mergeCoin = useRunStore((s) => s.mergeCoin)
  const removeCoin = useRunStore((s) => s.removeCoin)
  // The merge source (a coin id), or null when no merge is in progress.
  const [mergeSource, setMergeSource] = useState<number | null>(null)

  const startMerge = (id: number) => setMergeSource(id)
  const cancelMerge = () => setMergeSource(null)
  const completeMerge = (targetId: number) => {
    if (mergeSource !== null && mergeSource !== targetId) mergeCoin(mergeSource, targetId)
    setMergeSource(null)
  }

  if (coins.length === 0) {
    return <div className="collection collection--empty">No coins in the collection</div>
  }

  return (
    <div className="collection">
      {mergeSource !== null && (
        <p className="collection-hint">
          Merging <strong>into</strong> a coin — pick a target, or cancel.
        </p>
      )}
      <ul className="collection-list">
        {coins.map((coin) => (
          <li key={coin.id} className={`collection-item${mergeSource === coin.id ? ' collection-item--source' : ''}`}>
            <CoinBadges effects={coin.effects} />
            <div className="collection-item-actions">
              {mergeSource === null ? (
                <Button size="xs" variant="outline" onClick={() => startMerge(coin.id)}>
                  Merge
                </Button>
              ) : mergeSource === coin.id ? (
                <Button size="xs" variant="outline" onClick={cancelMerge}>
                  Cancel
                </Button>
              ) : (
                <Button size="xs" variant="secondary" onClick={() => completeMerge(coin.id)}>
                  Merge into
                </Button>
              )}
              <Button size="xs" variant="destructive" disabled={cash < REMOVE_COIN_COST} onClick={() => removeCoin(coin.id)}>
                Remove ${REMOVE_COIN_COST}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
