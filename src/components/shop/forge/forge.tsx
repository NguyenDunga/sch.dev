// Forge (13a.14 draft) — the area to merge two coins: pick a source and a
// target; the target keeps its identity and gains all of the source's
// effects (the source is consumed). Costs FORGE_COST.
//
// DRAFT: the slot picking is local UI state (tap a coin to fill the first
// empty slot — source first, then target; tap it again to clear); the Forge
// button is inert until the store action (mergeCoin + FORGE_COST) is wired.

import { useState } from 'react'
import { FORGE_COST } from '@/core/shop'
import type { Coin, CoinEffect } from '@/core/types'
import { Coin as CoinVisual } from '@/components/hand/coin'
import { Button } from '@/components/ui/button'

interface ForgeProps {
  coins: Coin[]
}

export function Forge({ coins }: ForgeProps) {
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)

  const source = sourceId !== null ? coins.find((c) => c.id === sourceId) : undefined
  const target = targetId !== null ? coins.find((c) => c.id === targetId) : undefined

  const pick = (id: number) => {
    if (sourceId === id) {
      setSourceId(null)
      return
    }
    if (targetId === id) {
      setTargetId(null)
      return
    }
    if (sourceId === null) setSourceId(id)
    else if (targetId === null) setTargetId(id)
  }

  // Result preview: target's effects + the source's effects (source order
  // preserved, same as the store merge).
  const result: CoinEffect[] | undefined =
    target && source
      ? [...target.effects, ...source.effects]
      : target
        ? [...target.effects]
        : undefined

  return (
    <section className="forge" aria-label="Forge">
      <header className="area-head">
        <h2 className="area-title">Forge</h2>
        <p className="area-desc">
          Merge two coins into one — the target keeps its identity and gains all of the source's
          effects. Costs ${FORGE_COST}.
        </p>
      </header>

      <div className="forge-slots">
        <ForgeSlot label="Source" coin={source} onClear={() => setSourceId(null)} />
        <span className="forge-op" aria-hidden="true">
          +
        </span>
        <ForgeSlot label="Target" coin={target} onClear={() => setTargetId(null)} />
        <span className="forge-op" aria-hidden="true">
          →
        </span>
        <div className="forge-slot forge-slot--result">
          <span className="forge-slot-label">Result</span>
          <span className="forge-slot-disc">
            {result ? <CoinVisual face={undefined} effects={result} size={56} /> : <span className="forge-slot-empty">—</span>}
          </span>
        </div>
      </div>

      <ul className="forge-picker">
        {coins.map((coin) => {
          const picked = sourceId === coin.id || targetId === coin.id
          return (
            <li key={coin.id}>
              <button
                type="button"
                className={`forge-coin${picked ? ' forge-coin--picked' : ''}`}
                aria-pressed={picked}
                aria-label={`Coin with ${coin.effects.length} effect${coin.effects.length === 1 ? '' : 's'}`}
                onClick={() => pick(coin.id)}
              >
                <CoinVisual face={undefined} effects={coin.effects} size={40} />
              </button>
            </li>
          )
        })}
      </ul>

      <div className="forge-actions">
        <Button size="lg" disabled>
          Forge (${FORGE_COST})
        </Button>
        <span className="area-draft-note">draft — action wiring next</span>
      </div>
    </section>
  )
}

interface ForgeSlotProps {
  label: string
  coin: Coin | undefined
  onClear: () => void
}

/** One forge slot: label + coin disc (or an empty well); tapping a filled
 *  slot clears it. */
function ForgeSlot({ label, coin, onClear }: ForgeSlotProps) {
  return (
    <div className="forge-slot">
      <span className="forge-slot-label">{label}</span>
      {coin ? (
        <button type="button" className="forge-slot-clear" aria-label={`Clear ${label.toLowerCase()} slot`} onClick={onClear}>
          <span className="forge-slot-disc">
            <CoinVisual face={undefined} effects={coin.effects} size={56} />
          </span>
        </button>
      ) : (
        <span className="forge-slot-disc forge-slot--empty-disc">
          <span className="forge-slot-empty">—</span>
        </span>
      )}
    </div>
  )
}
