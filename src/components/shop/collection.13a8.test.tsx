// @vitest-environment jsdom
//
// 13a.8 — Collection merge (WBS 13a.8):
//   - drag one coin onto another merges them (the store `mergeCoin` — UX §0)
//   - the two-step tap flow remains as the no-pointer / keyboard fallback
//   - Cancel clears the tap-merge source
//   - Remove deletes a coin and charges $1
//   - dropping a coin on itself is a no-op
//
// The dnd-kit pointer drag is simulated with fireEvent. jsdom has no layout,
// so element rects are mocked at the prototype level (dnd-kit hit-tests the
// droppable tiles and the drag-overlay copy against getBoundingClientRect).

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useRunStore } from '@/state/runStore'
import { makeLocalStorage } from '@/state/testHelpers'
import type { Coin } from '@/core/types'
import { Collection } from './collection'

beforeAll(() => {
  vi.stubGlobal('localStorage', makeLocalStorage())
})

afterEach(async () => {
  cleanup()
  vi.restoreAllMocks()
  // dnd-kit swallows the drag's trailing click with a document capture-phase
  // listener that it removes 50ms after the drag ends — wait it out so the
  // next test's clicks aren't stopped.
  await new Promise((r) => setTimeout(r, 60))
})

/** A store in the shop phase with two synthetic collection coins:
 *  coin 1 (a Tax coin) and coin 2 (plain). */
const COINS: Coin[] = [
  { id: 1, effects: [{ kind: 'tax' }] },
  { id: 2, effects: [] },
]

function shopState(): void {
  useRunStore.getState().startRun('13a8-merge')
  useRunStore.setState({
    phase: 'shop',
    cash: 10,
    deck: { drawPile: COINS, discardPile: [] },
  })
}

function makeRect(x: number, y: number, w: number, h: number): DOMRect {
  return {
    x,
    y,
    width: w,
    height: h,
    top: y,
    left: x,
    right: x + w,
    bottom: y + h,
    toJSON: () => ({}),
  } as DOMRect
}

/** Mock the collection's rects: tile 0 at (0,0,100,100), tile 1 at
 *  (200,0,100,100), and the drag-overlay copy at (0,0,44,44) (dnd-kit
 *  collision-tests the overlay's rect while it is mounted). */
function mockCollectionRects(): void {
  const original = Element.prototype.getBoundingClientRect
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this instanceof HTMLElement && this.classList.contains('collection-item--drag')) {
      return makeRect(0, 0, 44, 44)
    }
    if (this instanceof HTMLElement && this.classList.contains('collection-item')) {
      const tiles = Array.from(document.querySelectorAll('.collection-item'))
      const i = tiles.indexOf(this as HTMLElement)
      return makeRect(i === 0 ? 0 : 200, 0, 100, 100)
    }
    return original.call(this)
  })
}

/** A full pointer drag from the first handle, ending over the second tile
 *  (dnd-kit's PointerSensor: pointerdown on the handle, moves on the
 *  document). */
function dragFirstOntoSecond(): void {
  const [handle] = screen.getAllByRole('button', { name: /drag onto another coin to merge/i })
  fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 10, button: 0, buttons: 1, isPrimary: true })
  fireEvent.pointerMove(document, { pointerId: 1, clientX: 40, clientY: 10, buttons: 1 }) // activate (≥6px)
  fireEvent.pointerMove(document, { pointerId: 1, clientX: 250, clientY: 50, buttons: 1 }) // over tile 1
  fireEvent.pointerUp(document, { pointerId: 1, clientX: 250, clientY: 50 })
}

describe('13a.8 — collection merge', () => {
  it('dragging one coin onto another merges them (the store mergeCoin)', () => {
    shopState()
    render(<Collection coins={COINS} />)
    mockCollectionRects()
    dragFirstOntoSecond()

    const st = useRunStore.getState()
    // Coin 1 (the source) is gone; coin 2 gained its Tax effect.
    const collection = [...st.deck.drawPile, ...st.deck.discardPile]
    expect(collection).toHaveLength(1)
    expect(collection[0].id).toBe(2)
    expect(collection[0].effects).toEqual([{ kind: 'tax' }])
  })

  it('the two-step tap flow still merges (the no-pointer fallback)', () => {
    shopState()
    render(<Collection coins={COINS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /^merge$/i })[0])
    expect(screen.getByRole('button', { name: /merge into/i })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /merge into/i }))

    const st = useRunStore.getState()
    const collection = [...st.deck.drawPile, ...st.deck.discardPile]
    expect(collection).toHaveLength(1)
    expect(collection[0].id).toBe(2)
    expect(collection[0].effects).toEqual([{ kind: 'tax' }])
  })

  it('Cancel clears the tap-merge source', () => {
    shopState()
    render(<Collection coins={COINS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /^merge$/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    // The hint is gone and the buttons are back to the plain Merge state.
    expect(screen.queryByText(/merging into a coin/i)).toBeNull()
    expect(screen.getAllByRole('button', { name: /^merge$/i })).toHaveLength(2)
  })

  it('Remove deletes a coin and charges $1', () => {
    shopState()
    render(<Collection coins={COINS} />)
    fireEvent.click(screen.getAllByRole('button', { name: /remove \$1/i })[0])
    const st = useRunStore.getState()
    expect(st.cash).toBe(9)
    expect([...st.deck.drawPile, ...st.deck.discardPile]).toHaveLength(1)
  })

  it('dropping a coin on itself is a no-op', () => {
    shopState()
    render(<Collection coins={COINS} />)
    mockCollectionRects()
    const [handle] = screen.getAllByRole('button', { name: /drag onto another coin to merge/i })
    fireEvent.pointerDown(handle, { pointerId: 1, clientX: 10, clientY: 10, button: 0, buttons: 1, isPrimary: true })
    fireEvent.pointerMove(document, { pointerId: 1, clientX: 40, clientY: 10, buttons: 1 })
    fireEvent.pointerUp(document, { pointerId: 1, clientX: 50, clientY: 50 }) // released over itself
    const st = useRunStore.getState()
    expect([...st.deck.drawPile, ...st.deck.discardPile]).toHaveLength(2)
  })
})
