// 12.6 + 13a.5 + 13a.6 — hand controls: pick / 6th-pick shake / confirm /
// drag-drop / quick-play. Discard lives in use-discard-flow.ts. Kept out of
// RunScreen so the component stays under the 60-line limit.

import { useRef, useState } from 'react'
import type { RefObject } from 'react'
import { isFilled } from '@/core/helpers'
import type { Hand, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { dropTargets, type CoinSelection } from '@/components/hand/coin-dnd'
import { playSfx } from '@/components/juice/sfx'
import { useDiscardFlow } from './use-discard-flow'

/** 6th-pick feedback (UX §3): play full → shake the tapped coin 3px + buzz. */
function useShakeFeedback() {
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null)
  const bump = (id: number) => {
    setShake((s) => ({ id, n: (s?.n ?? 0) + 1 }))
    // 13.7 — the invalid buzz (UX §10).
    playSfx('error')
  }
  return { shake, bump }
}

/** 13a.5: a coin was dropped on the play row — pick it, or the whole
 *  selection when the dropped coin is selected (in hand order, capped at
 *  the free slots). The store does the move; the layoutId spring plays the
 *  flight (UX §5 `pick`). */
function makeDropToPlay(
  hand: Hand,
  play: Play,
  selection: CoinSelection,
  pickOne: (i: number) => void,
  onPlayFull: (coinId: number) => void,
) {
  return (handIndex: number) => {
    const targets = dropTargets(hand, play, handIndex, selection.selected)
    if (targets.length === 0) {
      const slot = hand[handIndex]
      if (slot?.kind === 'filled') onPlayFull(slot.coin.id) // play full — 6th-pick feedback
      selection.clear()
      return
    }
    for (const i of targets) pickOne(i)
    selection.clear()
  }
}

/** 13a.5: drag-drop + double-click quick-play on the play row (kept out of
 *  useHandFlow for the 60-line limit). */
function usePlayRowDnd(
  hand: Hand,
  play: Play,
  selection: CoinSelection,
  pickOne: (i: number) => void,
  lastPick: { current: { id: number; t: number } | null },
  onPlayFull: (coinId: number) => void,
  onUnpick: (i: number, coinId: number) => void,
  handleConfirm: () => void,
) {
  const movePlayCoin = useRunStore((s) => s.movePlayCoin)

  const handleDropToPlay = makeDropToPlay(hand, play, selection, pickOne, onPlayFull)

  /** The 2nd click of a double-click can land on the just-moved coin (mid-
   *  flight, hit-tested at its transformed position) — ignore that unpick. */
  const handleUnpick = (slotIndex: number, coinId: number) => {
    const lp = lastPick.current
    if (lp && lp.id === coinId && Date.now() - lp.t < 350) return
    onUnpick(slotIndex, coinId)
  }

  /** Double-click quick-play: the 2nd click lands on the (now empty) hand
   *  area, so the dblclick is caught on the hand row — if the last pick
   *  filled the row, confirm the hand. */
  const handleQuickPlay = () => {
    const lp = lastPick.current
    if (lp && Date.now() - lp.t < 600 && useRunStore.getState().play.every(isFilled)) handleConfirm()
  }

  const handleMovePlay = (from: number, to: number) => {
    if (from === to) return
    movePlayCoin(from, to)
    playSfx('pick')
  }

  return { handleDropToPlay, handleUnpick, handleQuickPlay, handleMovePlay }
}

export function useHandFlow(
  hand: Hand,
  play: Play,
  wellRef: RefObject<HTMLDivElement | null>,
  selection: CoinSelection,
  onUnpick: (i: number, coinId: number) => void,
) {
  const pickCoin = useRunStore((s) => s.pickCoin)
  const confirmPlay = useRunStore((s) => s.confirmPlay)
  const { shake, bump: onPlayFull } = useShakeFeedback()
  const lastPick = useRef<{ id: number; t: number } | null>(null) // 13a.5 quick-play guard
  const discardFlow = useDiscardFlow(hand, wellRef, selection, play, lastPick)

  /** Pick one hand coin (or the 6th-pick shake when the play is full); shared by click, keys, drag. */
  const pickOne = (i: number) => {
    const slot = hand[i]
    if (slot?.kind !== 'filled') return
    if (play.every(isFilled)) {
      onPlayFull(slot.coin.id)
      return
    }
    lastPick.current = { id: slot.coin.id, t: Date.now() }
    pickCoin(i)
    // 13.7 — the pick click (UX §10).
    playSfx('pick')
  }

  /** 13a.6: a plain tap always picks — the discard-mode toggle is gone
 *  (discard is the well drop or the per-coin D key). */
  const handleHandTap = (i: number) => {
    const slot = hand[i]
    if (slot?.kind !== 'filled') return
    pickOne(i)
  }

  const handleConfirm = () => {
    selection.clear()
    confirmPlay()
    // 13b.8 — the whoosh sfx is played per-coin on landing (onLand), not here.
  }

  const dnd = usePlayRowDnd(hand, play, selection, pickOne, lastPick, onPlayFull, onUnpick, handleConfirm)

  return {
    shake,
    pickOne,
    handleHandTap,
    handleConfirm,
    ...dnd,
    ...discardFlow, // M23: includes handleWellTap (the tap-discard)
  }
}
