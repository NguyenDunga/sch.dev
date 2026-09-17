// @vitest-environment jsdom
//
// 13a.5 — coin multi-select + drop targeting (unit):
//   - useCoinSelection: Ctrl/Cmd+click toggle, Shift+click range from the
//     anchor, Ctrl/Cmd+A select-all (filled only), Esc/empty clear, and the
//     auto-clear when the play phase ends
//   - dropTargets: a drop picks the dropped coin — or the WHOLE selection
//     (in hand order) when the dropped coin is selected — capped at the free
//     play slots
//   - DraggableHandCoin click routing: plain click picks; Ctrl/Cmd+click and
//     Shift+click select (never pick)

import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, renderHook } from '@testing-library/react'
import { DraggableHandCoin, discardTargets, dropTargets, routeDrop, selectedInOrder, useCoinSelection } from './index'
import type { Coin, Hand, HandSlot, Play } from '@/core/types'

/** A matchMedia stub for framer's useReducedMotion (same pattern as
 *  hand-coin.test.tsx). */
const mql = {
  matches: false,
  media: '(prefers-reduced-motion)',
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
}
vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mql))

afterEach(() => cleanup())

/** A minimal filled hand (n coins) / play row (5 slots). */
function coin(id: number): Coin {
  return { id, effects: [] }
}
function slot(id: number): HandSlot {
  return { kind: 'filled', coin: coin(id), face: 'H', echoUsed: false }
}
function hand(n: number): Hand {
  return Array.from({ length: n }, (_, i) => slot(i + 1))
}
function play(filled: number): Play {
  return Array.from({ length: 5 }, (_, i) => (i < filled ? slot(100 + i) : { kind: 'empty' }))
}

describe('useCoinSelection', () => {
  it('toggle: Ctrl/Cmd+click adds, then removes, the coin', () => {
    const { result } = renderHook(({ active }) => useCoinSelection(active), { initialProps: { active: true } })
    act(() => result.current.toggle(2))
    expect(result.current.isSelected(2)).toBe(true)
    act(() => result.current.toggle(2))
    expect(result.current.isSelected(2)).toBe(false)
    expect(result.current.selected.size).toBe(0)
  })

  it('rangeSelect: Shift+click selects the filled range from the anchor', () => {
    const { result } = renderHook(() => useCoinSelection(true))
    const h = hand(8)
    act(() => result.current.toggle(1)) // anchor at 1
    act(() => result.current.rangeSelect(4, h))
    expect([...result.current.selected].sort()).toEqual([1, 2, 3, 4])
    // range backwards (anchor 4 → 2)
    act(() => result.current.clear())
    act(() => result.current.toggle(4))
    act(() => result.current.rangeSelect(2, h))
    expect([...result.current.selected].sort()).toEqual([2, 3, 4])
  })

  it('selectAll: every filled coin (empty slots skipped)', () => {
    const { result } = renderHook(() => useCoinSelection(true))
    const h: Hand = [...hand(3), { kind: 'empty' }, slot(9), slot(10)]
    act(() => result.current.selectAll(h))
    expect(result.current.selected.size).toBe(5)
    expect(result.current.isSelected(3)).toBe(false) // the empty slot
  })

  it('auto-clears when the play phase ends', () => {
    const { result, rerender } = renderHook(({ active }) => useCoinSelection(active), { initialProps: { active: true } })
    act(() => result.current.toggle(0))
    expect(result.current.selected.size).toBe(1)
    rerender({ active: false })
    expect(result.current.selected.size).toBe(0)
  })
})

describe('dropTargets', () => {
  it('a plain drop picks just the dropped coin', () => {
    expect(dropTargets(hand(8), play(0), 3, new Set())).toEqual([3])
  })

  it('a selected drop picks the whole selection (in hand order)', () => {
    const sel = new Set([5, 1, 3])
    expect(dropTargets(hand(8), play(0), 3, sel)).toEqual([1, 3, 5])
  })

  it('caps at the free play slots', () => {
    expect(dropTargets(hand(8), play(3), 0, new Set([0, 1, 2, 3]))).toEqual([0, 1])
  })

  it('full play → nothing (the caller shakes + buzzes)', () => {
    expect(dropTargets(hand(8), play(5), 0, new Set([0]))).toEqual([])
  })
})

describe('discardTargets (13a.6)', () => {
  it('a plain drop discards just the dropped coin', () => {
    expect(discardTargets(hand(8), 3, new Set())).toEqual([3])
  })

  it('a selected drop discards the whole selection (in hand order)', () => {
    const sel = new Set([5, 1, 3])
    expect(discardTargets(hand(8), 3, sel)).toEqual([1, 3, 5])
  })

  it('a dropped coin NOT in the selection discards just itself', () => {
    expect(discardTargets(hand(8), 3, new Set([1, 2]))).toEqual([3])
  })

  it('unlimited — no cap (unlike dropTargets)', () => {
    expect(discardTargets(hand(8), 0, new Set([0, 1, 2, 3, 4, 5, 6, 7]))).toHaveLength(8)
  })

  it('selectedInOrder skips empty slots', () => {
    const h: Hand = [...hand(3), { kind: 'empty' }, slot(9), slot(10)]
    expect(selectedInOrder(h, new Set([4, 1, 0]))).toEqual([0, 1, 4])
  })
})

describe('routeDrop', () => {
  it('a hand coin dropped on the play row → pick', () => {
    expect(routeDrop('hand-3', 'play-row')).toEqual({ kind: 'pick', handIndex: 3 })
  })

  it('a hand coin dropped on a slot → pick (the row is the target)', () => {
    expect(routeDrop('hand-0', 'slot-2')).toEqual({ kind: 'pick', handIndex: 0 })
  })

  it('a hand coin dropped on the discard well → discard (13a.6)', () => {
    expect(routeDrop('hand-2', 'discard-well')).toEqual({ kind: 'discard', handIndex: 2 })
  })

  it('a play coin dropped on a slot → move', () => {
    expect(routeDrop('play-4', 'slot-1')).toEqual({ kind: 'move', from: 4, to: 1 })
  })

  it('a play coin dropped on the play row (itself) → nothing', () => {
    expect(routeDrop('play-2', 'play-row')).toBeNull()
  })

  it('a play coin dropped on the discard well → nothing (only hand coins discard)', () => {
    expect(routeDrop('play-1', 'discard-well')).toBeNull()
  })

  it('a hand coin dropped on the hand / elsewhere → nothing', () => {
    expect(routeDrop('hand-1', 'hand-2')).toBeNull()
    expect(routeDrop('hand-1', null)).toBeNull()
    expect(routeDrop('charm-0', 'play-row')).toBeNull()
  })
})

describe('DraggableHandCoin click routing', () => {
  function setup() {
    const onPick = vi.fn()
    const onToggleSelect = vi.fn()
    const onRangeSelect = vi.fn()
    render(
      <DraggableHandCoin
        coin={coin(1)}
        index={0}
        enabled
        shaking={false}
        shakeKey={0}
        selected={false}
        onPick={onPick}
        onToggleSelect={onToggleSelect}
        onRangeSelect={onRangeSelect}
      />,
    )
    return { onPick, onToggleSelect, onRangeSelect }
  }

  it('plain click picks (the fallback)', () => {
    const { onPick, onToggleSelect, onRangeSelect } = setup()
    fireEvent.click(document.querySelector('.hand-coin')!)
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onToggleSelect).not.toHaveBeenCalled()
    expect(onRangeSelect).not.toHaveBeenCalled()
  })

  it('Ctrl+click toggles the selection (never picks)', () => {
    const { onPick, onToggleSelect, onRangeSelect } = setup()
    fireEvent.click(document.querySelector('.hand-coin')!, { ctrlKey: true })
    expect(onToggleSelect).toHaveBeenCalledTimes(1)
    expect(onPick).not.toHaveBeenCalled()
    expect(onRangeSelect).not.toHaveBeenCalled()
  })

  it('Cmd+click toggles too (mac)', () => {
    const { onPick, onToggleSelect } = setup()
    fireEvent.click(document.querySelector('.hand-coin')!, { metaKey: true })
    expect(onToggleSelect).toHaveBeenCalledTimes(1)
    expect(onPick).not.toHaveBeenCalled()
  })

  it('Shift+click range-selects (never picks)', () => {
    const { onPick, onToggleSelect, onRangeSelect } = setup()
    fireEvent.click(document.querySelector('.hand-coin')!, { shiftKey: true })
    expect(onRangeSelect).toHaveBeenCalledTimes(1)
    expect(onPick).not.toHaveBeenCalled()
    expect(onToggleSelect).not.toHaveBeenCalled()
  })

  it('the D key discards the focused coin (13a.6 per-coin control)', () => {
    const onDiscard = vi.fn()
    const onPick = vi.fn()
    render(
      <DraggableHandCoin
        coin={coin(1)}
        index={0}
        enabled
        shaking={false}
        shakeKey={0}
        selected={false}
        onPick={onPick}
        onToggleSelect={() => {}}
        onRangeSelect={() => {}}
        onDiscard={onDiscard}
      />,
    )
    const btn = document.querySelector('.hand-coin')!
    fireEvent.keyDown(btn, { key: 'd' })
    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onPick).not.toHaveBeenCalled()
    // uppercase D too; and D never picks
    fireEvent.keyDown(btn, { key: 'D' })
    expect(onDiscard).toHaveBeenCalledTimes(2)
  })

  it('D does nothing when the coin is disabled (not the play phase)', () => {
    const onDiscard = vi.fn()
    render(
      <DraggableHandCoin
        coin={coin(1)}
        index={0}
        enabled={false}
        shaking={false}
        shakeKey={0}
        selected={false}
        onPick={() => {}}
        onToggleSelect={() => {}}
        onRangeSelect={() => {}}
        onDiscard={onDiscard}
      />,
    )
    fireEvent.keyDown(document.querySelector('.hand-coin')!, { key: 'd' })
    expect(onDiscard).not.toHaveBeenCalled()
  })
})
