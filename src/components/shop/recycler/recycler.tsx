// Recycler (13a.14) — sell coins for money: RECYCLE_PRICE_PER_EFFECT ($1)
// per effect, with a $1 minimum (a plain 50/50 coin still sells for $1).
// The list is sortable (price high→low by default, price low→high, or deck
// order) and scrolls when the collection outgrows the panel.

import { useMemo, useState } from 'react'
import { useRunStore } from '@/state/runStore'
import { RECYCLE_PRICE_PER_EFFECT, recyclePrice } from '@/core/shop'
import type { Coin } from '@/core/types'
import { Coin as CoinVisual } from '@/components/hand/coin'
import { Button } from '@/components/ui/button'

type RecyclerSort = 'priceDesc' | 'priceAsc' | 'order'

const SORT_LABELS: Record<RecyclerSort, string> = {
  priceDesc: 'Price (high → low)',
  priceAsc: 'Price (low → high)',
  order: 'Deck order',
}

interface RecyclerProps {
  coins: Coin[]
}

export function Recycler({ coins }: RecyclerProps) {
  const [sort, setSort] = useState<RecyclerSort>('priceDesc')
  const sellCoin = useRunStore((s) => s.sellCoin)

  // The sorted view (deck order is the collection order — draw pile first).
  const sorted = useMemo(() => {
    const list = [...coins]
    if (sort === 'priceDesc') list.sort((a, b) => recyclePrice(b) - recyclePrice(a) || a.id - b.id)
    else if (sort === 'priceAsc') list.sort((a, b) => recyclePrice(a) - recyclePrice(b) || a.id - b.id)
    return list
  }, [coins, sort])

  return (
    <section className="recycler" aria-label="Recycler">
      <header className="area-head">
        <h2 className="area-title">Recycler</h2>
        <p className="area-desc">
          Sell coins for money — ${RECYCLE_PRICE_PER_EFFECT} per effect (plain coins sell for $
          {RECYCLE_PRICE_PER_EFFECT}).
        </p>
      </header>

      <div className="recycler-toolbar">
        <label className="recycler-sort-label" htmlFor="recycler-sort">
          Sort
        </label>
        <select
          id="recycler-sort"
          className="recycler-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as RecyclerSort)}
        >
          {(Object.keys(SORT_LABELS) as RecyclerSort[]).map((s) => (
            <option key={s} value={s}>
              {SORT_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {coins.length === 0 ? (
        <p className="recycler-empty">No coins to recycle</p>
      ) : (
        <ul className="recycler-list">
          {sorted.map((coin) => (
            <li key={coin.id} className="recycler-row">
              <span className="recycler-disc">
                <CoinVisual face={undefined} effects={coin.effects} size={40} />
              </span>
              <span className="recycler-effects">
                {coin.effects.length === 0
                  ? 'plain 50/50'
                  : `${coin.effects.length} effect${coin.effects.length > 1 ? 's' : ''}`}
              </span>
              <span className="recycler-price">${recyclePrice(coin)}</span>
              <Button size="xs" sfx="cash" onClick={() => sellCoin(coin.id)}>
                Sell
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
