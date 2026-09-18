// Forge (13a.14) — the area to merge two coins: pick a source and a target;
// the target keeps its identity, the special rules (core/forge) decide the
// result (a matching pair is consumed and replaced, everything else stacks),
// the source is consumed. Costs FORGE_COST.

import { useState } from 'react'
import { useRunStore } from '@/state/runStore'
import { FORGE_COST } from '@/core/shop'
import { forgeCoin, forgeRuleLabel } from '@/core/forge'
import type { Coin } from '@/core/types'
import { Coin as CoinVisual } from '@/components/hand/coin'
import { Button } from '@/components/ui/button'

interface ForgeProps {
  coins: Coin[]
}

export function Forge({ coins }: ForgeProps) {
  const [sourceId, setSourceId] = useState<number | null>(null)
  const [targetId, setTargetId] = useState<number | null>(null)
  const cash = useRunStore((s) => s.cash)
  const mergeCoin = useRunStore((s) => s.mergeCoin)

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

  // The live preview: the forge result (special rule or plain stack).
  const outcome = source && target ? forgeCoin(source, target) : null
  const canForge = source !== undefined && target !== undefined && cash >= FORGE_COST

  const forge = () => {
    if (!canForge || !source || !target) return
    mergeCoin(source.id, target.id)
    setSourceId(null)
    setTargetId(null)
  }

  return (
    <section className="forge" aria-label="Forge">
      <header className="area-head">
        <h2 className="area-title">Forge</h2>
        <p className="area-desc">
          Merge two coins into one for ${FORGE_COST} — matching pairs forge into something new
          (the preview shows the result); all other effects stack.
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
            {outcome ? (
              <CoinVisual face={undefined} effects={outcome.effects} size={56} />
            ) : (
              <span className="forge-slot-empty">—</span>
            )}
          </span>
          {/* Always rendered (space reserved) so the layout never jumps when
              a special fires; invisible when no rule matched. */}
          <span className={`forge-special${outcome?.special ? '' : ' forge-special--hidden'}`}>
            {outcome?.special
              ? forgeRuleLabel(outcome.special.rule, outcome.special.a, outcome.special.b)
              : '\u00A0'}
          </span>
        </div>
      </div>

      <div className="forge-picker">
        {coins.map((coin) => {
          const picked = sourceId === coin.id || targetId === coin.id
          return (
            <button
              key={coin.id}
              type="button"
              className={`forge-coin${picked ? ' forge-coin--picked' : ''}`}
              aria-pressed={picked}
              aria-label={`Coin with ${coin.effects.length} effect${coin.effects.length === 1 ? '' : 's'}`}
              onClick={() => pick(coin.id)}
            >
              <CoinVisual face={undefined} effects={coin.effects} size={40} />
            </button>
          )
        })}
      </div>

      <div className="forge-actions">
        <Button size="lg" sfx="buy" disabled={!canForge} onClick={forge}>
          Forge (${FORGE_COST})
        </Button>
        {source && target && cash < FORGE_COST && (
          <span className="forge-short" role="status">
            need ${FORGE_COST} cash
          </span>
        )}
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
        <button
          type="button"
          className="forge-slot-clear"
          aria-label={`Clear ${label.toLowerCase()} slot`}
          onClick={onClear}
        >
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
