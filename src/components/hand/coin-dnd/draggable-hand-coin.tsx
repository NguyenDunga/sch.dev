// A hand coin with dnd-kit drag wired in: press-drag to the play row picks
// it (or its whole selection); press-drag to the discard well discards it
// (13a.6). Plain click still picks; Ctrl/Cmd+click and Shift+click drive
// the multi-select instead; D (focused) discards (13a.6).

import { useDraggable } from '@dnd-kit/core'
import { useCallback } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { Coin } from '@/core/types'
import { HandCoin } from '../hand-coin/hand-coin'

const DRAG_ID_PREFIX = 'hand-'

interface DraggableHandCoinProps {
  coin: Coin
  index: number
  enabled: boolean
  shaking: boolean
  shakeKey: number
  dealIndex?: number
  selected: boolean
  onPick: (el: HTMLElement) => void
  /** Ctrl/Cmd+click: toggle this coin in the multi-selection. */
  onToggleSelect: () => void
  /** Shift+click: range-select from the last anchor to this coin. */
  onRangeSelect: () => void
  /** 13a.6: per-coin discard control (the D key while the coin is focused).
   *  The store does the move (`discard`). */
  onDiscard?: (el: HTMLElement) => void
  /** 13a.6: register this coin's element (the discard ghost's flight origin). */
  registerRef?: (el: HTMLButtonElement | null) => void
}

export function DraggableHandCoin({
  coin, index, enabled, shaking, shakeKey, dealIndex, selected,
  onPick, onToggleSelect, onRangeSelect, onDiscard, registerRef,
}: DraggableHandCoinProps) {
  const { listeners, setNodeRef, isDragging } = useDraggable({
    id: `${DRAG_ID_PREFIX}${index}`,
    disabled: !enabled,
  })

  // The dnd-kit node ref + the coin-element registry (ghost origin) share
  // one callback ref.
  const ref = useCallback(
    (el: HTMLButtonElement | null) => {
      setNodeRef(el)
      registerRef?.(el)
    },
    [setNodeRef, registerRef],
  )

  const onSelectClick = (e: ReactMouseEvent<HTMLButtonElement>): boolean => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      onToggleSelect()
      return true
    }
    if (e.shiftKey) {
      onRangeSelect()
      return true
    }
    return false
  }

  return (
    <HandCoin
      ref={ref}
      coin={coin}
      index={index}
      enabled={enabled}
      shaking={shaking}
      shakeKey={shakeKey}
      dealIndex={dealIndex}
      selected={selected}
      dragging={isDragging}
      dragProps={listeners}
      onSelectClick={onSelectClick}
      onPick={onPick}
      onDiscard={onDiscard}
    />
  )
}
