// C6 — Run screen: the full hand flow (draw → play → toss → buff → score).
//
// 12.4/12.5 landed the coin components + 3D toss. 12.6 wires the rest:
// blind header, charm bar (C7), unlimited discard (mode toggle + redraw
// pips), the explicit Confirm (play→toss) and Score (buff→score) buttons
// (no auto-timer), and the Echo re-flip (buff). The Save button lands in
// 12.9. 13.1 lands the deal/pick/discard motion (UX §5): the deck + discard
// well piles, the staggered deal flight, the pick/unpick springs, and the
// discard ghost (coin → well, fade). UI is a thin layer — it reads RunState
// and calls store actions; juice never mutates state (UX §0).

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { createPortal } from 'react-dom'
import { isFilled } from '@/core/helpers'
import type { Coin, Hand, HandPhase, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { HandCoin } from '@/components/hand/hand-coin'
import { PlaySlot } from '@/components/hand/play-slot'
import { ScoreTicker } from '@/components/hand/score-ticker'
import { BlindHeader } from '@/components/run/blind-header'
import { ActionBar } from '@/components/run/action-bar'
import { SaveButton } from '@/components/run/save-button'
import { CharmBar } from '@/components/charm-bar/charm-bar'
import { Deck, DiscardWell } from '@/components/run/piles'
import { DiscardGhostLayer, type DiscardGhost } from '@/components/run/discard-ghost'
import { computeDealIndex, idsOf, sameIds, type PrevSlots } from '@/components/run/deal'
import { ScoringChoreography } from '@/components/juice/scoring-choreography'
import { takeSnapshot } from '@/components/juice/choreography'
import { useScoringChoreography } from '@/components/juice/use-scoring-choreography'
import type { Beat, ChoroSeq, PlaySnapshot } from '@/components/juice/choreography'
import { playSfx } from '@/components/juice/sfx'
import { TOSS } from '@/lib/motion'

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
function useDeals(hand: Hand, play: Play): Map<number, number> {
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
function useAutoDraw() {
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
function useRunFlags(handPhase: HandPhase, play: Play) {
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

/** 13.1 — in-flight discard ghosts (the coin flies to the well + fades). */
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

/** 13.7 — the staggered toss whoosh (UX §10): one per filled slot, ±5% rate,
 *  cleared on unmount (no leak). */
function useTossSfx() {
  const timers = useRef<number[]>([])
  useEffect(() => {
    const t = timers.current
    return () => {
      for (const id of t) window.clearTimeout(id)
    }
  }, [])
  return (n: number) => {
    for (let i = 0; i < n; i++) {
      timers.current.push(
        window.setTimeout(() => playSfx('toss', { rate: 1 + (Math.random() * 0.1 - 0.05) }), i * TOSS.stagger * 1000),
      )
    }
  }
}

/** Hand controls (12.6 + 13.1): pick / discard (+ ghost) / 6th-pick shake /
 *  confirm. Kept out of RunScreen so the component stays under the 60-line
 *  function limit. */
function useHandFlow(hand: Hand, play: Play, wellRef: RefObject<HTMLDivElement | null>) {
  const pickCoin = useRunStore((s) => s.pickCoin)
  const discard = useRunStore((s) => s.discard)
  const confirmPlay = useRunStore((s) => s.confirmPlay)
  // Discard mode: tap a hand coin to discard it (unlimited). Reset on confirm
  // (the only way a hand ends) so a new hand never starts in discard mode.
  const [discardMode, setDiscardMode] = useState(false)
  // 6th-pick feedback (UX §3): play full → shake the tapped coin 3px.
  const [shake, setShake] = useState<{ id: number; n: number } | null>(null)
  const { ghosts, spawn: spawnDiscardGhost, remove: removeGhost } = useDiscardGhost(wellRef)
  const playToss = useTossSfx()

  const handleHandTap = (i: number, el: HTMLElement) => {
    const slot = hand[i]
    if (slot.kind !== 'filled') return
    if (discardMode) {
      spawnDiscardGhost(slot.coin, el)
      discard(i)
      // 13.7 — the discard "shhk" (UX §10).
      playSfx('discard')
      return
    }
    if (play.every(isFilled)) {
      setShake((s) => ({ id: slot.coin.id, n: (s?.n ?? 0) + 1 }))
      // 13.7 — the invalid buzz (UX §10).
      playSfx('error')
      return
    }
    pickCoin(i)
    // 13.7 — the pick click (UX §10).
    playSfx('pick')
  }

  const handleConfirm = () => {
    setDiscardMode(false)
    confirmPlay()
    playToss(play.filter(isFilled).length)
  }

  return { discardMode, setDiscardMode, shake, handleHandTap, handleConfirm, ghosts, removeGhost }
}

interface HandRowProps {
  hand: Hand
  canPick: boolean
  discardMode: boolean
  shake: { id: number; n: number } | null
  deals: Map<number, number>
  onPick: (i: number, el: HTMLElement) => void
}

/** The face-down hand row: tappable coins (pick, or discard in discard mode). */
function HandRow({ hand, canPick, discardMode, shake, deals, onPick }: HandRowProps) {
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
            dealIndex={deals.get(slot.coin.id)}
            onPick={(el) => onPick(i, el)}
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
  deals: Map<number, number>
  wellRef: RefObject<HTMLDivElement | null>
  onPick: (i: number, el: HTMLElement) => void
  onUnpick: (i: number) => void
  getReflip: (i: number) => (() => void) | undefined
}

/** The play row (5 slots) + the deck/discard-well piles + the face-down
 *  hand row. */
function PlayArea({
  play,
  hand,
  revealed,
  canPick,
  discardMode,
  shake,
  deals,
  wellRef,
  onPick,
  onUnpick,
  getReflip,
}: PlayAreaProps) {
  return (
    <div className="play-area">
      <div className="play-row">
        {play.map((slot, i) => (
          <PlaySlot key={i} slot={slot} index={i} revealed={revealed} onUnpick={() => onUnpick(i)} onReflip={getReflip(i)} />
        ))}
      </div>
      <div className="piles-row">
        <DiscardWell wellRef={wellRef} />
        <Deck />
      </div>
      <HandRow hand={hand} canPick={canPick} discardMode={discardMode} shake={shake} deals={deals} onPick={onPick} />
    </div>
  )
}

/** 13.3 — the scoring choreography wiring: the play snapshot is captured
 *  at the Score tap, right before score() (the store empties the play
 *  synchronously — read from the store, not the render closure, so it is
 *  always current), then the 7-beat sequence plays over lastScore
 *  (purely presentational, UX §0/§6). */
function useScoringChoro(score: () => void) {
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

interface RunPortalsProps {
  ghosts: DiscardGhost[]
  removeGhost: (key: number) => void
  /** The choreography view (13.3): the sequence + beat + the flight refs. */
  choro: {
    seq: ChoroSeq | null
    beat: Beat
    reduced: boolean
    chipsRef: RefObject<HTMLSpanElement | null>
    cashRef: RefObject<HTMLSpanElement | null>
  }
}

/** The portaled fixed layers (13.1 discard ghost + 13.3 choreo): portaled
 *  to <body> so the fixed layers track viewport coords even while the
 *  screen-in/out transform is active. */
function RunPortals({ ghosts, removeGhost, choro }: RunPortalsProps) {
  return (
    <>
      {createPortal(<DiscardGhostLayer ghosts={ghosts} onDone={removeGhost} />, document.body)}
      {createPortal(
        <ScoringChoreography
          seq={choro.seq}
          beat={choro.beat}
          reduced={choro.reduced}
          chipsRef={choro.chipsRef}
          cashRef={choro.cashRef}
        />,
        document.body,
      )}
    </>
  )
}

/** 13.7 — the unpick click (UX §10). */
function useUnpickSfx(unpickCoin: (i: number) => void) {
  return (i: number) => {
    playSfx('unpick')
    unpickCoin(i)
  }
}

export function RunScreen() {
  const hand = useRunStore((s) => s.hand)
  const play = useRunStore((s) => s.play)
  const handPhase = useRunStore((s) => s.handPhase)
  const lastScore = useRunStore((s) => s.lastScore)
  const unpickCoin = useRunStore((s) => s.unpickCoin)
  const score = useRunStore((s) => s.score)
  const save = useRunStore((s) => s.save)
  const wellRef = useRef<HTMLDivElement>(null)
  const deals = useDeals(hand, play)
  const { discardMode, setDiscardMode, shake, handleHandTap, handleConfirm, ghosts, removeGhost } = useHandFlow(hand, play, wellRef)
  useAutoDraw()
  const { revealed, canPick, canConfirm, canScore, getReflip } = useRunFlags(handPhase, play)
  const { seq, beat, skipped, reduced, chipsRef, cashRef, handleScore } = useScoringChoro(score)
  // 13.7 — the unpick click (UX §10).
  const onUnpick = useUnpickSfx(unpickCoin)

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
        deals={deals}
        wellRef={wellRef}
        onPick={handleHandTap}
        onUnpick={onUnpick}
        getReflip={getReflip}
      />
      <ScoreTicker
        score={lastScore}
        choro={seq ? { runId: seq.runId, beat, skipped } : null}
        chipsRef={chipsRef}
        cashRef={cashRef}
      />
      <ActionBar
        handPhase={handPhase}
        discardMode={discardMode}
        canConfirm={canConfirm}
        canScore={canScore}
        onToggleDiscard={() => setDiscardMode((m) => !m)}
        onConfirm={handleConfirm}
        onScore={handleScore}
      />
      <RunPortals
        ghosts={ghosts}
        removeGhost={removeGhost}
        choro={{ seq, beat, reduced, chipsRef, cashRef }}
      />
    </main>
  )
}
