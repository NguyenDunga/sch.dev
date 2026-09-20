// 13.1 — in-flight discard ghosts (the coin flies to the well + fades) +
// 13a.6 — the discard paths: drag-to-well and the per-coin D key. All call
// the same store `discard` (UX §0); the ghost (13.1) plays the flight from
// the coin's element to the well.

import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Coin, Hand, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { discardTargets, type CoinSelection } from '@/components/hand/coin-dnd'
import { playSfx } from '@/components/juice/sfx'
import type { DiscardGhost } from '@/components/run/discard-ghost'

function useDiscardGhost(wellRef: RefObject<HTMLDivElement | null>) {
  const [ghosts, setGhosts] = useState<DiscardGhost[]>([])
  const ghostKey = useRef(0)
  const spawn = (coin: Coin, el: HTMLElement) => {
    const well = wellRef.current
    if (!well) return
    const rect = el.getBoundingClientRect()
    const wr = well.getBoundingClientRect()
    setGhosts((gs) => [
      ...gs,
      {
        key: ghostKey.current++,
        coin,
        from: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
        to: { x: wr.left + wr.width / 2, y: wr.top + wr.height / 2 },
      },
    ])
  }
  const remove = (key: number) => setGhosts((gs) => gs.filter((g) => g.key !== key))
  return { ghosts, spawn, remove }
}

/** M23: the well tap-discard — the complete touch alternative to
 *  drag-to-well: 1) the selected hand coins, 2) the last picked coin
 *  (still in the play row — unpick it, then discard it). Returns true when
 *  a discard happened (the well only toggles the pile panel otherwise).
 *  Module-level so useDiscardFlow stays under the 60-line limit. */
function useWellTap(opts: {
  play: Play
  lastPickRef: { current: { id: number; t: number } | null }
  tapDiscardSelected: () => boolean
  unpickCoin: (slotIndex: number) => void
}): () => boolean {
  const { play, lastPickRef, tapDiscardSelected, unpickCoin } = opts
  return () => {
    if (tapDiscardSelected()) return true
    const lp = lastPickRef.current
    if (!lp) return false
    const playIdx = play.findIndex((s) => s.kind === 'filled' && s.coin.id === lp.id)
    if (playIdx === -1) return false
    unpickCoin(playIdx)
    const st = useRunStore.getState()
    const handIdx = st.hand.findIndex((s) => s.kind === 'filled' && s.coin.id === lp.id)
    if (handIdx === -1) return false // unpick was a no-op (hand full) — fall through to the panel
    st.discard(handIdx)
    lastPickRef.current = null
    // 13.7 — the discard "shhk" (UX §10).
    playSfx('discard')
    return true
  }
}

export function useDiscardFlow(
  hand: Hand,
  wellRef: RefObject<HTMLDivElement | null>,
  selection: CoinSelection,
  play: Play,
  lastPickRef: { current: { id: number; t: number } | null },
) {
  const discard = useRunStore((s) => s.discard)
  const unpickCoin = useRunStore((s) => s.unpickCoin)
  const { ghosts, spawn: spawnDiscardGhost, remove: removeGhost } = useDiscardGhost(wellRef)
  const coinRefs = useRef(new Map<number, HTMLElement>()) // coin elements (ghost origin)

  /** Discard one hand coin (store action + ghost flight + the "shhk"). */
  const discardOne = (i: number, el?: HTMLElement | null) => {
    const slot = hand[i]
    if (slot?.kind !== 'filled') return
    if (el) spawnDiscardGhost(slot.coin, el)
    discard(i)
    // 13.7 — the discard "shhk" (UX §10).
    playSfx('discard')
  }

  /** A coin was dropped on the discard well: discard it, or the whole
   *  selection when the dropped coin is selected (unlimited — no cap). */
  const handleDropToDiscard = (handIndex: number) => {
    for (const i of discardTargets(hand, handIndex, selection.selected)) discardOne(i, coinRefs.current.get(i))
    selection.clear()
  }

  /** Register a coin's element (the discard ghost's flight origin). */
  const registerCoin = (i: number, el: HTMLButtonElement | null) => {
    if (el) coinRefs.current.set(i, el)
    else coinRefs.current.delete(i)
  }

  /** M23: a well TAP (no drag) — discard the current selection (ghosts
   *  included). Returns true when something was discarded. */
  const tapDiscardSelected = (): boolean => {
    if (selection.selected.size === 0) return false
    for (const i of [...selection.selected].sort((a, b) => a - b)) discardOne(i, coinRefs.current.get(i))
    selection.clear()
    return true
  }

  const handleWellTap = useWellTap({ play, lastPickRef, tapDiscardSelected, unpickCoin })

  return { discardOne, handleDropToDiscard, registerCoin, tapDiscardSelected, handleWellTap, ghosts, removeGhost }
}
