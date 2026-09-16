// 13a.5 — Coin multi-select + drop targeting (pure logic, no JSX).
//
// The selection is pure UI state (UX §0 — it never mutates the store):
// Ctrl/Cmd+click toggles a coin, Shift+click range-selects from the last
// anchor, Ctrl/Cmd+A selects all, click empty space / Esc clears. Playing a
// selection calls the same `pickCoin` the plain click calls.

import { useCallback, useRef, useState } from 'react'
import { PLAY_SIZE } from '@/core/balance'
import { isFilled } from '@/core/helpers'
import type { Hand, Play } from '@/core/types'

export interface CoinSelection {
  /** The selected hand indices (filled coins only). */
  selected: Set<number>
  isSelected: (i: number) => boolean
  /** Ctrl/Cmd+click: toggle one coin (and set the range anchor). */
  toggle: (i: number) => void
  /** Shift+click: select the filled range from the last anchor to i. */
  rangeSelect: (i: number, hand: Hand) => void
  /** Ctrl/Cmd+A: select every filled coin in the hand. */
  selectAll: (hand: Hand) => void
  clear: () => void
}

/** The multi-select state (13a.5). `active` = the play phase; the selection
 *  auto-clears when it ends (confirm / any phase change). */
export function useCoinSelection(active: boolean): CoinSelection {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const anchor = useRef<number | null>(null)

  // Clear when leaving the play phase — render-time reset (React's
  // "adjust state during render" pattern; no effect, no stale frame).
  const [prevActive, setPrevActive] = useState(active)
  if (active !== prevActive) {
    setPrevActive(active)
    if (!active) setSelected(new Set())
  }

  const toggle = useCallback((i: number) => {
    anchor.current = i
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }, [])

  const rangeSelect = useCallback((i: number, hand: Hand) => {
    const from = anchor.current ?? i
    const [lo, hi] = from <= i ? [from, i] : [i, from]
    setSelected((prev) => {
      const next = new Set(prev)
      for (let k = lo; k <= hi; k++) {
        if (hand[k]?.kind === 'filled') next.add(k)
      }
      return next
    })
    anchor.current = i
  }, [])

  const selectAll = useCallback((hand: Hand) => {
    const all = new Set<number>()
    hand.forEach((s, i) => {
      if (s.kind === 'filled') all.add(i)
    })
    setSelected(all)
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])
  const isSelected = useCallback((i: number) => selected.has(i), [selected])

  return { selected, isSelected, toggle, rangeSelect, selectAll, clear }
}

/**
 * The hand indices a drop should pick (13a.5): if the dropped coin is
 * selected, the WHOLE selection (in hand order); else just the dropped coin.
 * Capped at the free play slots (0 free → nothing).
 */
export function dropTargets(hand: Hand, play: Play, dropped: number, selected: Set<number>): number[] {
  const filled: number[] = []
  hand.forEach((s, i) => {
    if (s.kind === 'filled') filled.push(i)
  })
  const list = selected.has(dropped) && selected.size > 0 ? filled.filter((i) => selected.has(i)) : [dropped]
  const room = PLAY_SIZE - play.filter(isFilled).length
  return list.slice(0, Math.max(0, room))
}

/** A routed dnd-kit drag end (13a.5). */
export type DropRoute =
  | { kind: 'pick'; handIndex: number }
  | { kind: 'move'; from: number; to: number }
  | null

/** Route a dnd-kit drag end (13a.5): a hand coin dropped on the play row (or
 *  any slot) picks it; a play coin dropped on a slot reorders the row. */
export function routeDrop(activeId: unknown, overId: unknown): DropRoute {
  const a = String(activeId)
  const o = String(overId)
  if (a.startsWith('hand-') && (o === 'play-row' || o.startsWith('slot-'))) {
    return { kind: 'pick', handIndex: Number(a.slice('hand-'.length)) }
  }
  if (a.startsWith('play-') && o.startsWith('slot-')) {
    return { kind: 'move', from: Number(a.slice('play-'.length)), to: Number(o.slice('slot-'.length)) }
  }
  return null
}
