// C6 — Run screen: the full hand flow (draw → play → toss → buff → score).
//
// 12.4/12.5 landed the coin components + 3D toss. 12.6 wires the rest:
// blind header, charm bar (C7), unlimited discard (mode toggle + redraw
// pips), the explicit Confirm (play→toss) and Score (buff→score) buttons
// (no auto-timer), and the Echo re-flip (buff). The Save button lands in
// 12.9. UI is a thin layer — it reads RunState and calls store actions.

import { useEffect, useState } from 'react'
import { isFilled } from '@/core/helpers'
import type { Hand, HandPhase, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { HandCoin } from '@/components/hand/hand-coin'
import { PlaySlot } from '@/components/hand/play-slot'
import { ScoreTicker } from '@/components/hand/score-ticker'
import { BlindHeader } from '@/components/run/blind-header'
import { ActionBar } from '@/components/run/action-bar'
import { SaveButton } from '@/components/run/save-button'
import { CharmBar } from '@/components/charm-bar/charm-bar'

/** Hand controls (12.6): pick / discard / 6th-pick shake / confirm. Kept out
 *  of RunScreen so the component stays under the 60-line function limit. */
function useHandFlow(hand: Hand, play: Play) {
  const pickCoin = useRunStore((s) => s.pickCoin)
  const discard = useRunStore((s) => s.discard)
  const confirmPlay = useRunStore((s) => s.confirmPlay)
  // Discard mode: tap a hand coin to discard it (unlimited). Reset on confirm
  // (the only way a hand ends) so a new hand never starts in discard mode.
  const [discardMode, setDiscardMode] = useState(false)
  // 6th-pick feedback (UX §3): play full → shake the tapped coin 3px.
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null)

  const handleHandTap = (i: number) => {
    const slot = hand[i]
    if (slot.kind !== 'filled') return
    if (discardMode) {
      discard(i)
      return
    }
    if (play.every(isFilled)) {
      setShake((s) => ({ id: slot.coin.id, n: (s?.n ?? 0) + 1 }))
      return
    }
    pickCoin(i)
  }

  const handleConfirm = () => {
    setDiscardMode(false)
    confirmPlay()
  }

  return { discardMode, setDiscardMode, shake, handleHandTap, handleConfirm }
}

interface HandRowProps {
  hand: Hand
  canPick: boolean
  discardMode: boolean
  shake: { id: number; n: number } | null
  onPick: (i: number) => void
}

/** The face-down hand row: tappable coins (pick, or discard in discard mode). */
function HandRow({ hand, canPick, discardMode, shake, onPick }: HandRowProps) {
  return (
    <div className={`hand-row${discardMode ? ' hand-row--discard' : ''}`}>
      {hand.map((slot, i) =>
        slot.kind === 'filled' ? (
          <HandCoin
            key={slot.coin.id}
            coin={slot.coin}
            index={i}
            enabled={canPick}
            shaking={shake?.id === slot.coin.id}
            shakeKey={shake?.n ?? 0}
            onPick={() => onPick(i)}
          />
        ) : (
          <div key={`empty-${i}`} className="hand-slot--empty" aria-hidden />
        ),
      )}
    </div>
  )
}

/** Echo re-flip allowed? (buff phase, an unused Echo coin in the play). */
function canReflipAt(play: Play, handPhase: HandPhase, slotIndex: number): boolean {
  if (handPhase !== 'buff') return false
  const slot = play[slotIndex]
  if (slot.kind !== 'filled' || slot.echoUsed) return false
  return slot.coin.effects.some((e) => e.kind === 'echo')
}

interface PlayAreaProps {
  play: Play
  hand: Hand
  revealed: boolean
  canPick: boolean
  discardMode: boolean
  shake: { id: number; n: number } | null
  onPick: (i: number) => void
  onUnpick: (i: number) => void
  getReflip: (i: number) => (() => void) | undefined
}

/** The play row (5 slots) + the face-down hand row. */
function PlayArea({ play, hand, revealed, canPick, discardMode, shake, onPick, onUnpick, getReflip }: PlayAreaProps) {
  return (
    <div className="play-area">
      <div className="play-row">
        {play.map((slot, i) => (
          <PlaySlot key={i} slot={slot} index={i} revealed={revealed} onUnpick={() => onUnpick(i)} onReflip={getReflip(i)} />
        ))}
      </div>
      <HandRow hand={hand} canPick={canPick} discardMode={discardMode} shake={shake} onPick={onPick} />
    </div>
  )
}

export function RunScreen() {
  const hand = useRunStore((s) => s.hand)
  const play = useRunStore((s) => s.play)
  const handPhase = useRunStore((s) => s.handPhase)
  const lastScore = useRunStore((s) => s.lastScore)
  const drawHand = useRunStore((s) => s.drawHand)
  const unpickCoin = useRunStore((s) => s.unpickCoin)
  const echoReflip = useRunStore((s) => s.echoReflip)
  const score = useRunStore((s) => s.score)
  const save = useRunStore((s) => s.save)
  const { discardMode, setDiscardMode, shake, handleHandTap, handleConfirm } = useHandFlow(hand, play)

  // Draw (automatic, SDD C6 step 1): the store sits in 'draw' at hand start;
  // the UI drives the auto-draw.
  useEffect(() => {
    if (handPhase === 'draw') drawHand()
  }, [handPhase, drawHand])

  // The face is resolved once the toss phase has run (play → toss → buff is
  // synchronous in the store; the UI observes 'buff'/'score').
  const revealed = handPhase === 'toss' || handPhase === 'buff' || handPhase === 'score'
  const canPick = handPhase === 'play'
  const canConfirm = handPhase === 'play' && play.some(isFilled)
  const canScore = handPhase === 'buff'

  // Echo re-flip (buff): an unused Echo coin in the play can be re-tossed once.
  const getReflip = (i: number) => (canReflipAt(play, handPhase, i) ? () => echoReflip(i) : undefined)

  return (
    <main className="run-screen">
      <div className="run-top">
        <BlindHeader />
        <SaveButton onSave={save} />
      </div>
      <CharmBar />
      <PlayArea
        play={play}
        hand={hand}
        revealed={revealed}
        canPick={canPick}
        discardMode={discardMode}
        shake={shake}
        onPick={handleHandTap}
        onUnpick={unpickCoin}
        getReflip={getReflip}
      />
      <ScoreTicker score={lastScore} />
      <ActionBar
        handPhase={handPhase}
        discardMode={discardMode}
        canConfirm={canConfirm}
        canScore={canScore}
        onToggleDiscard={() => setDiscardMode((m) => !m)}
        onConfirm={handleConfirm}
        onScore={score}
      />
    </main>
  )
}
