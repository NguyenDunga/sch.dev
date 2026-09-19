// The play area: the 6-slot play row (a drop target — 13a.5) + the
// deck/discard-well piles (the well is a drop target too — 13a.6) + the
// face-down hand row. Wrapped in the coin dnd context (PlayAreaHost) so a
// hand coin can be press-dragged onto the play row / into the well, and a
// play coin dragged to another slot to reorder the row.

import { CoinDnd, PlayDropZone, PlaySlotDnd, DiscardWellDrop } from '@/components/hand/coin-dnd'
import { DeckInspector } from '@/components/deck/deck-inspector'
import { knownFace } from '@/components/hand/coin'
import type { Hand, Play } from '@/core/types'
import type { RefObject } from 'react'
import type { CoinSelection } from '@/components/hand/coin-dnd'
import { HandRow } from './hand-row'

export interface PlayAreaProps {
  play: Play
  hand: Hand
  revealed: boolean
  canPick: boolean
  shake: { id: number; n: number } | null
  deals: Map<number, number>
  wellRef: RefObject<HTMLDivElement | null>
  selection: CoinSelection
  onPick: (i: number) => void
  onDiscard: (i: number, el: HTMLElement) => void
  onUnpick: (i: number, coinId: number) => void
  onToggleSelect: (i: number) => void
  onRangeSelect: (i: number) => void
  onQuickPlay: () => void
  registerRef: (i: number, el: HTMLButtonElement | null) => void
  getReflip: (i: number) => (() => void) | undefined
  /** 13b.8: a tossed coin has landed (index) — drives the projection / sfx /
   *  auto-score from the toss animation (no setTimeout). */
  onLand: (i: number) => void
}

export function PlayArea({
  play, hand, revealed, canPick, shake, deals, wellRef, selection,
  onPick, onDiscard, onUnpick, onToggleSelect, onRangeSelect, onQuickPlay,
  registerRef, getReflip, onLand,
}: PlayAreaProps) {
  return (
    <div className="play-area">
      <PlayDropZone>
        <div className="play-row">
          {play.map((slot, i) => {
            // Magnetic pre-display: a face-down Magnetic coin pre-displays its
            // immediate left neighbour's known face (a hint about what it'll
            // likely match). Only the immediate left neighbour counts.
            const isMagnetic = slot.kind === 'filled' && slot.coin.effects.some((e) => e.kind === 'magnetic')
            const left = play[i - 1]
            const predisplayFace =
              isMagnetic && left?.kind === 'filled' ? knownFace(left.coin.effects) : undefined
            return (
              <PlaySlotDnd
                key={i}
                index={i}
                slot={slot}
                revealed={revealed}
                canReorder={canPick}
                predisplayFace={predisplayFace}
                onUnpick={() => onUnpick(i, slot.kind === 'filled' ? slot.coin.id : -1)}
                onReflip={getReflip(i)}
                onLand={onLand}
              />
            )
          })}
        </div>
      </PlayDropZone>
      <div className="piles-row">
        <DiscardWellDrop wellRef={wellRef} />
        <DeckInspector />
      </div>
      <HandRow
        hand={hand}
        canPick={canPick}
        shake={shake}
        deals={deals}
        selection={selection}
        onPick={onPick}
        onDiscard={onDiscard}
        onToggleSelect={onToggleSelect}
        onRangeSelect={onRangeSelect}
        onQuickPlay={onQuickPlay}
        registerRef={registerRef}
      />
    </div>
  )
}

export interface PlayAreaHostProps extends Omit<PlayAreaProps, 'onToggleSelect' | 'onRangeSelect'> {
  onDropToPlay: (i: number) => void
  onDropToDiscard: (i: number) => void
  onMovePlay: (from: number, to: number) => void
}

/** 13a.5 + 13a.6: the play area wrapped in the dnd context. */
export function PlayAreaHost({
  onDropToPlay, onDropToDiscard, onMovePlay, ...playArea
}: PlayAreaHostProps) {
  const { hand, selection, ...rest } = playArea
  return (
    <CoinDnd hand={hand} onDropToPlay={onDropToPlay} onDropToDiscard={onDropToDiscard} onMovePlay={onMovePlay}>
      <PlayArea
        {...rest}
        hand={hand}
        selection={selection}
        onToggleSelect={selection.toggle}
        onRangeSelect={(i) => selection.rangeSelect(i, hand)}
      />
    </CoinDnd>
  )
}
