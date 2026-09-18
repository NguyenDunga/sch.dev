// Run-screen plumbing hooks: the staggered deals (13.1), the auto-draw,
// the phase flags + Echo re-flip, the unpick sfx (13.7), the scoring
// choreography wiring (13.3), the finish-on-settle, and the empty-space
// click that clears the selection (13a.5).

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { isFilled } from '@/core/helpers'
import type { Hand, HandPhase, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { takeSnapshot, useScoringChoreography } from '@/components/juice/choreo'
import type { Beat, ChoroSeq, PlaySnapshot } from '@/components/juice/choreo'
import { computeDealIndex, idsOf, sameIds, type PrevSlots } from '@/components/run/piles'
import { playSfx } from '@/components/juice/sfx'
import type { CoinSelection } from '@/components/hand/coin-dnd'

/** { the previous hand/play ids, the deals computed from them }. */
interface DealState {
  prev: PrevSlots
  deals: Map<number, number>
}

/** The stagger index of each freshly dealt coin (13.1).
 *  The previous hand/play ids are state, adjusted during render (the
 *  React-documented "store information from previous renders" pattern — no
 *  effect, so the deals are visible in the very render the coins mount):
 *  when a row changes, `deals` is computed from the *old* prev and the new
 *  prev is stored, so the committed render carries the fresh deals. */
export function useDeals(hand: Hand, play: Play): Map<number, number> {
  const [dealState, setDealState] = useState<DealState>(() => ({
    prev: { hand: new Set(), play: new Set() },
    deals: new Map(),
  }))
  if (!sameIds(dealState.prev.hand, hand) || !sameIds(dealState.prev.play, play)) {
    setDealState({
      prev: { hand: idsOf(hand), play: idsOf(play) },
      deals: computeDealIndex(hand, dealState.prev),
    })
  }
  return dealState.deals
}

/** Draw (automatic, SDD C6 step 1): the store sits in 'draw' at hand start;
 *  the UI drives the auto-draw. */
export function useAutoDraw() {
  const handPhase = useRunStore((s) => s.handPhase)
  const drawHand = useRunStore((s) => s.drawHand)
  useEffect(() => {
    if (handPhase === 'draw') {
      drawHand()
      // 13.7 — the draw whoosh (UX §10).
      playSfx('deal')
    }
  }, [handPhase, drawHand])
}

/** Phase flags + the Echo re-flip callback (buff, unused Echo coin). */
export function useRunFlags(handPhase: HandPhase, play: Play) {
  const echoReflip = useRunStore((s) => s.echoReflip)
  // The face is resolved once the toss phase has run (play → toss → buff is
  // synchronous in the store; the UI observes 'buff'/'score').
  const revealed = handPhase === 'toss' || handPhase === 'buff' || handPhase === 'score'
  const canPick = handPhase === 'play'
  const canConfirm = handPhase === 'play' && play.some(isFilled)
  const canScore = handPhase === 'buff'
  const getReflip = (i: number) => (canReflipAt(play, handPhase, i) ? () => echoReflip(i) : undefined)
  return { revealed, canPick, canConfirm, canScore, getReflip }
}

/** 13.3 — the scoring choreography wiring: the play snapshot is captured
 *  at the Score tap, right before score() (the store empties the play
 *  synchronously — read from the store, not the render closure, so it is
 *  always current), then the 7-beat sequence plays over lastScore
 *  (purely presentational, UX §0/§6). */
export function useScoringChoro(score: () => void) {
  const snapshotRef = useRef<PlaySnapshot | null>(null)
  const { seq, beat, skipped, reduced } = useScoringChoreography(snapshotRef)
  const chipsRef = useRef<HTMLSpanElement>(null)
  const cashRef = useRef<HTMLSpanElement>(null)
  const handleScore = () => {
    const s = useRunStore.getState()
    snapshotRef.current = takeSnapshot(s.play, s.charms)
    score()
  }
  return { seq, beat, skipped, reduced, chipsRef, cashRef, handleScore }
}

/** Async hand flow: the store rests in 'score' while the scoring choreography
 *  plays over lastScore. When the sequence settles (beat 7 — the natural end
 *  or a skip), advance the hand: deal the next hand (draw) or end the blind.
 *  A new round is only started after the calculation animation + ticker are
 *  done. Fires exactly once per scoring sequence (keyed by runId). */
export function useFinishOnSettle(
  choro: { seq: ChoroSeq | null; beat: Beat },
  finishScore: () => void,
): void {
  const finishedRunIdRef = useRef(0)
  useEffect(() => {
    if (choro.seq && choro.beat === 7 && finishedRunIdRef.current !== choro.seq.runId) {
      finishedRunIdRef.current = choro.seq.runId
      finishScore()
    }
  }, [choro.seq, choro.beat, finishScore])
}

/** 13.7 — the unpick click (UX §10). */
export function useUnpickSfx(unpickCoin: (i: number) => void) {
  return (i: number) => {
    playSfx('unpick')
    unpickCoin(i)
  }
}

/** 13a.5: clicking empty space (not a control) clears the selection. */
export function useBackgroundClear(selection: CoinSelection) {
  return (e: ReactMouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return
    selection.clear()
  }
}

/** Echo re-flip allowed? (buff phase, an unused Echo coin in the play). */
export function canReflipAt(play: Play, handPhase: HandPhase, slotIndex: number): boolean {
  if (handPhase !== 'buff') return false
  const slot = play[slotIndex]
  if (slot.kind !== 'filled' || slot.echoUsed) return false
  return slot.coin.effects.some((e) => e.kind === 'echo')
}
