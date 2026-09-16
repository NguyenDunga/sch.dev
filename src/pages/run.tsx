// C6 — Run screen: the full hand flow (draw → play → toss → buff → score).
//
// 12.4/12.5 landed the coin components + 3D toss. 12.6 wires the rest:
// blind header, charm bar (C7), unlimited discard, the explicit Confirm
// (play→toss) and Score (buff→score) buttons (no auto-timer), and the Echo
// re-flip (buff). The Save button lands in 12.9. 13.1 lands the
// deal/pick/discard motion (UX §5): the deck + discard well piles, the
// staggered deal flight, the pick/unpick springs, and the discard ghost
// (coin → well, fade). 13a.1 auto-advances a no-Echo buff straight to
// scoring. 13a.5 adds drag-and-drop + multi-select. 13a.6 replaces the
// discard-mode toggle with always-live drop zones: drag a coin to the play
// row to pick, drag it into the discard well to discard, plus a corner
// quick-discard hotspot and a per-coin D key (the keyboard discard path).
// UI is a thin layer — it reads RunState and calls store actions; juice
// never mutates state (UX §0).

import { useCallback, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { BLINDS } from '@/core/balance'
import { isFilled, none, some } from '@/core/helpers'
import { projectScore } from '@/core/scoring'
import type { BossRuleId, CharmId, Coin, Hand, HandPhase, Option, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { dropTargets, discardTargets, selectedInOrder, useCoinSelection, type CoinSelection } from '@/components/hand/coin-dnd'
import { CoinDnd, DiscardWellDrop, DraggableHandCoin, PlayDropZone, PlaySlotDnd } from '@/components/hand/coin-dnd.tsx'
import { ScoreTicker } from '@/components/hand/score-ticker'
import type { TossProjection } from '@/components/hand/score-ticker'
import { landDelay } from '@/components/hand/toss'
import { BlindHeader } from '@/components/run/blind-header'
import { ActionBar } from '@/components/run/action-bar'
import { SaveButton } from '@/components/run/save-button'
import { OnboardingHint } from '@/components/run/onboarding-hint'
import { CharmBar } from '@/components/charm-bar/charm-bar'
import { Deck } from '@/components/run/piles'
import { DiscardGhostLayer } from '@/components/run/discard-ghost.tsx'
import type { DiscardGhost } from '@/components/run/discard-ghost'
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

/** 13a.6 — track the coin the pointer is over (the quick-discard hotspot's
 *  target). A short grace window covers the handoff to the hotspot: the
 *  coin's pointerleave fires BEFORE the hotspot's pointerenter, so the
 *  hovered coin stays valid a moment after the pointer leaves it. */
function useHoveredCoin() {
  const hovered = useRef<number | null>(null)
  const clearTimer = useRef<number | null>(null)
  const onHover = (i: number) => {
    hovered.current = i
    if (clearTimer.current !== null) {
      window.clearTimeout(clearTimer.current)
      clearTimer.current = null
    }
  }
  const onHoverEnd = () => {
    if (clearTimer.current !== null) window.clearTimeout(clearTimer.current)
    clearTimer.current = window.setTimeout(() => {
      hovered.current = null
      clearTimer.current = null
    }, 120)
  }
  useEffect(() => {
    const t = clearTimer
    return () => {
      if (t.current !== null) window.clearTimeout(t.current)
    }
  }, [])
  return { hovered, onHover, onHoverEnd }
}

/** 13a.6 — the discard paths: drag-to-well, the per-coin D key, and the
 *  corner quick-discard hotspot. All call the same store `discard` (UX §0);
 *  the ghost (13.1) plays the flight from the coin's element to the well.
 *  Kept out of useHandFlow for the 60-line limit. */
function useDiscardFlow(
  hand: Hand,
  wellRef: RefObject<HTMLDivElement | null>,
  selection: CoinSelection,
  hovered: RefObject<number | null>,
) {
  const discard = useRunStore((s) => s.discard)
  const { ghosts, spawn: spawnDiscardGhost, remove: removeGhost } = useDiscardGhost(wellRef)
  const coinRefs = useRef(new Map<number, HTMLElement>()) // coin elements (ghost origin)
  const lastQuickDiscard = useRef(0) // pointerenter + click of one tap = one discard

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

  /** The corner quick-discard hotspot: discards the hovered coin (pointer
   *  handoff), else the whole selection. A tap fires pointerenter AND
   *  click — the 300ms guard makes one tap one discard. */
  const handleQuickDiscard = () => {
    const now = Date.now()
    if (now - lastQuickDiscard.current < 300) return
    lastQuickDiscard.current = now
    const i = hovered.current
    if (i !== null && hand[i]?.kind === 'filled') {
      discardOne(i, coinRefs.current.get(i))
      return
    }
    if (selection.selected.size > 0) {
      for (const j of selectedInOrder(hand, selection.selected)) discardOne(j, coinRefs.current.get(j))
      selection.clear()
    }
  }

  /** Register a coin's element (the discard ghost's flight origin). */
  const registerCoin = (i: number, el: HTMLButtonElement | null) => {
    if (el) coinRefs.current.set(i, el)
    else coinRefs.current.delete(i)
  }

  return { discardOne, handleDropToDiscard, handleQuickDiscard, registerCoin, ghosts, removeGhost }
}

/** Hand controls (12.6 + 13.1 + 13a.5 + 13a.6): pick / 6th-pick shake /
 *  confirm / drag-drop / quick-play. Discard lives in useDiscardFlow. Kept
 *  out of RunScreen so the component stays under the 60-line limit. */
function useHandFlow(
  hand: Hand,
  play: Play,
  wellRef: RefObject<HTMLDivElement | null>,
  selection: CoinSelection,
  onUnpick: (i: number, coinId: number) => void,
) {
  const pickCoin = useRunStore((s) => s.pickCoin)
  const confirmPlay = useRunStore((s) => s.confirmPlay)
  const { shake, bump: onPlayFull } = useShakeFeedback()
  const playToss = useTossSfx()
  const lastPick = useRef<{ id: number; t: number } | null>(null) // 13a.5 quick-play guard
  const hover = useHoveredCoin() // 13a.6 — the quick-discard hotspot's target
  const discardFlow = useDiscardFlow(hand, wellRef, selection, hover.hovered)

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
 *  (discard is the well drop / the D key / the quick-discard hotspot). */
  const handleHandTap = (i: number) => {
    const slot = hand[i]
    if (slot?.kind !== 'filled') return
    pickOne(i)
  }

  const handleConfirm = () => {
    selection.clear()
    confirmPlay()
    playToss(play.filter(isFilled).length)
  }

  const dnd = usePlayRowDnd(hand, play, selection, pickOne, lastPick, onPlayFull, onUnpick, handleConfirm)

  return {
    shake,
    pickOne,
    handleHandTap,
    handleConfirm,
    onCoinHover: hover.onHover,
    onCoinHoverEnd: hover.onHoverEnd,
    ...dnd,
    ...discardFlow,
  }
}

/** 13a.6: the corner quick-discard hotspot — hovering it discards the
 *  hovered coin (pointer handoff) or the whole selection; click works too
 *  (the no-pointer path: select the coins, Tab here, Enter). */
function QuickDiscardChip({ onQuickDiscard }: { onQuickDiscard: () => void }) {
  return (
    <button
      type="button"
      className="quick-discard"
      onPointerEnter={onQuickDiscard}
      onClick={onQuickDiscard}
      aria-label="Quick discard: discards the hovered coin or the selected coins"
      title="Quick discard — hover a coin, then this"
    >
      <Trash2 size={16} strokeWidth={2.5} aria-hidden />
      <span>Discard</span>
    </button>
  )
}

interface HandRowProps {
  hand: Hand
  canPick: boolean
  shake: { id: number; n: number } | null
  deals: Map<number, number>
  selection: CoinSelection
  onPick: (i: number) => void
  /** 13a.6: per-coin discard control (the D key while the coin is focused). */
  onDiscard: (i: number, el: HTMLElement) => void
  onToggleSelect: (i: number) => void
  onRangeSelect: (i: number) => void
  /** 13a.5: double-click quick-play (caught on the row — the coin moves away). */
  onQuickPlay: () => void
  /** 13a.6: hover tracking (the quick-discard hotspot's target). */
  onHover: (i: number) => void
  onHoverEnd: () => void
  registerRef: (i: number, el: HTMLButtonElement | null) => void
  /** 13a.6: the corner quick-discard hotspot. */
  onQuickDiscard: () => void
}

/** The face-down hand row: tappable coins (pick), draggable to the play row
 *  (13a.5) or the discard well (13a.6), multi-selectable — plus the corner
 *  quick-discard hotspot (13a.6). */
function HandRow({
  hand,
  canPick,
  shake,
  deals,
  selection,
  onPick,
  onDiscard,
  onToggleSelect,
  onRangeSelect,
  onQuickPlay,
  onHover,
  onHoverEnd,
  registerRef,
  onQuickDiscard,
}: HandRowProps) {
  return (
    <div className="hand-zone">
      <div className="hand-row" onDoubleClick={onQuickPlay}>
        {hand.map((slot, i) =>
          slot.kind === 'filled' ? (
            <DraggableHandCoin
              key={slot.coin.id}
              coin={slot.coin}
              index={i}
              enabled={canPick}
              shaking={shake?.id === slot.coin.id}
              shakeKey={shake?.n ?? 0}
              dealIndex={deals.get(slot.coin.id)}
              selected={selection.isSelected(i)}
              onPick={() => onPick(i)}
              onDiscard={(el) => onDiscard(i, el)}
              onToggleSelect={() => onToggleSelect(i)}
              onRangeSelect={() => onRangeSelect(i)}
              onHover={() => onHover(i)}
              onHoverEnd={onHoverEnd}
              registerRef={(el) => registerRef(i, el)}
            />
          ) : (
            <div key={`empty-${i}`} className="hand-slot--empty" aria-hidden />
          ),
        )}
      </div>
      {canPick && <QuickDiscardChip onQuickDiscard={onQuickDiscard} />}
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
  onHover: (i: number) => void
  onHoverEnd: () => void
  registerRef: (i: number, el: HTMLButtonElement | null) => void
  onQuickDiscard: () => void
  getReflip: (i: number) => (() => void) | undefined
}

/** The play row (5 slots, a drop target — 13a.5) + the deck/discard-well
 *  piles (the well is a drop target too — 13a.6) + the face-down hand row
 *  with the corner quick-discard hotspot (13a.6). */
function PlayArea({
  play, hand, revealed, canPick, shake, deals, wellRef, selection,
  onPick, onDiscard, onUnpick, onToggleSelect, onRangeSelect, onQuickPlay,
  onHover, onHoverEnd, registerRef, onQuickDiscard, getReflip,
}: PlayAreaProps) {
  return (
    <div className="play-area">
      <PlayDropZone>
        <div className="play-row">
          {play.map((slot, i) => (
            <PlaySlotDnd
              key={i}
              index={i}
              slot={slot}
              revealed={revealed}
              canReorder={canPick}
              onUnpick={() => onUnpick(i, slot.kind === 'filled' ? slot.coin.id : -1)}
              onReflip={getReflip(i)}
            />
          ))}
        </div>
      </PlayDropZone>
      <div className="piles-row">
        <DiscardWellDrop wellRef={wellRef} />
        <Deck />
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
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        registerRef={registerRef}
        onQuickDiscard={onQuickDiscard}
      />
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

/** 13a.1 — auto-advance buff → score when the buff phase has nothing for
 *  the player (no unused Echo re-flip in the play). Waits for the last
 *  tossed coin to land (stagger + rise) plus a short beat, then fires the
 *  same handleScore the button calls (snapshot + score). The explicit
 *  Score button stays as a fast-forward; a double score is a no-op (the
 *  store only scores from 'buff'). A hand with an available re-flip is
 *  never auto-scored (the player may want to re-flip first). */
/** 13a.1/13a.7: a hand with nothing left to interact with scores itself —
 *  no available Echo re-flip (no Echo coins, or all of them already used).
 *  The delay waits for the last coin to land (the 13.2 stagger) + a beat to
 *  read the projected total (13a.7) before the choreography. The Score
 *  button remains the explicit fast-forward / early end. No store changes
 *  (UX §0). */
function useAutoScore(handPhase: HandPhase, play: Play, onScore: () => void) {
  const reflipAvailable = play.some((_, i) => canReflipAt(play, handPhase, i))
  useEffect(() => {
    if (handPhase !== 'buff' || reflipAvailable) return
    const n = play.filter(isFilled).length
    const delay = ((n - 1) * TOSS.stagger + TOSS.rise + 0.9) * 1000
    const id = window.setTimeout(onScore, delay)
    return () => window.clearTimeout(id)
  }, [handPhase, reflipAvailable, play, onScore])
}

/** 13a.7 — the live projected score (chips × mult = total) as the tossed
 *  coins land. The store resolves the faces at confirm (the toss animation
 *  plays over 'buff', UX §0), so the projection is deterministic — the
 *  pipeline over the first `landed` coins (projectScore), matching the real
 *  score exactly (M13 §0). Null outside the buff phase (and for an empty
 *  play). */
function useTossProjection(handPhase: HandPhase, play: Play, boss: Option<BossRuleId>, charms: CharmId[]): TossProjection | null {
  const reduced = useReducedMotion() ?? false
  const [landed, setLanded] = useState(0)
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())
  const inBuffRef = useRef(false)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t))
    timersRef.current.clear()
  }, [])

  // A fresh toss (the phase just became 'buff'): reset the landed count and
  // schedule each coin's landing (left→right, the 13.2 stagger). Re-flips
  // keep the phase 'buff' — no reset; the projection recomputes on the new
  // face (the play prop changes).
  useEffect(() => {
    const inBuff = handPhase === 'buff'
    if (inBuff && !inBuffRef.current) {
      inBuffRef.current = true
      setLanded(0)
      clearTimers()
      let k = 0
      play.forEach((slot, i) => {
        if (slot.kind !== 'filled') return
        k += 1
        const at = k
        const t = setTimeout(() => setLanded((cur) => Math.max(cur, at)), landDelay(i, reduced) * 1000)
        timersRef.current.add(t)
      })
    }
    if (!inBuff) inBuffRef.current = false
  }, [handPhase, play, reduced, clearTimers])

  // Clear any pending landing timers on unmount.
  useEffect(() => clearTimers, [clearTimers])

  if (handPhase !== 'buff') return null
  const total = play.filter(isFilled).length
  if (total === 0) return null
  return { score: projectScore(play, boss, charms, landed), landed, total }
}

/** 13a.5 — the keyboard shortcut set (locked 2026-09-15): number keys 1–9/
 *  0 pick the nth hand coin, Ctrl/Cmd+A selects all, Enter confirms, Space
 *  scores, Esc clears the selection. Buttons keep their native Enter/Space
 *  semantics — the shortcuts only fire when focus is off a control. */
function useHandShortcuts(
  hand: Hand,
  play: Play,
  handPhase: HandPhase,
  selection: CoinSelection,
  pickOne: (i: number) => void,
  onConfirm: () => void,
  onScore: () => void,
) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const onControl = !!target?.closest?.('button, a, input, textarea, select')
      if (e.key === 'Escape') {
        selection.clear()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
        if (handPhase === 'play') {
          e.preventDefault() // not the browser select-all
          selection.selectAll(hand)
        }
        return
      }
      if (onControl) return // buttons keep their native Enter/Space
      if (handPhase === 'play') {
        const n = e.key === '0' ? 10 : Number(e.key)
        if (Number.isInteger(n) && n >= 1 && n <= hand.length) {
          e.preventDefault()
          // Ctrl/Cmd+number = the keyboard Ctrl+click (toggle the selection).
          if (e.ctrlKey || e.metaKey) selection.toggle(n - 1)
          else pickOne(n - 1)
          return
        }
        if (e.key === 'Enter' && play.some(isFilled)) {
          e.preventDefault()
          onConfirm()
        }
        return
      }
      if (handPhase === 'buff' && e.key === ' ' && play.some(isFilled)) {
        e.preventDefault() // no page scroll
        onScore()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hand, play, handPhase, selection, pickOne, onConfirm, onScore])
}

/** 13a.5: clicking empty space (not a control) clears the selection. */
function useBackgroundClear(selection: CoinSelection) {
  return (e: ReactMouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input, textarea, select')) return
    selection.clear()
  }
}

interface PlayAreaHostProps {
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
  onDropToPlay: (i: number) => void
  onDropToDiscard: (i: number) => void
  onMovePlay: (from: number, to: number) => void
  onQuickPlay: () => void
  onHover: (i: number) => void
  onHoverEnd: () => void
  registerRef: (i: number, el: HTMLButtonElement | null) => void
  onQuickDiscard: () => void
  getReflip: (i: number) => (() => void) | undefined
}

/** 13a.5 + 13a.6: the play area wrapped in the dnd context — a hand coin can
 *  be press-dragged onto the play row to pick it, or into the discard well
 *  to discard it (the click / D-key / hotspot fallbacks stay), and a play
 *  coin can be dragged to another slot to reorder the row. */
function PlayAreaHost({
  play,
  hand,
  revealed,
  canPick,
  shake,
  deals,
  wellRef,
  selection,
  onPick,
  onDiscard,
  onUnpick,
  onDropToPlay,
  onDropToDiscard,
  onMovePlay,
  onQuickPlay,
  onHover,
  onHoverEnd,
  registerRef,
  onQuickDiscard,
  getReflip,
}: PlayAreaHostProps) {
  return (
    <CoinDnd hand={hand} onDropToPlay={onDropToPlay} onDropToDiscard={onDropToDiscard} onMovePlay={onMovePlay}>
      <PlayArea
        play={play}
        hand={hand}
        revealed={revealed}
        canPick={canPick}
        shake={shake}
        deals={deals}
        wellRef={wellRef}
        selection={selection}
        onPick={onPick}
        onDiscard={onDiscard}
        onUnpick={onUnpick}
        onToggleSelect={selection.toggle}
        onRangeSelect={(i) => selection.rangeSelect(i, hand)}
        onQuickPlay={onQuickPlay}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        registerRef={registerRef}
        onQuickDiscard={onQuickDiscard}
        getReflip={getReflip}
      />
    </CoinDnd>
  )
}

/** The action bar with its derived flags (keeps RunScreen compact). */
function RunActions({
  handPhase,
  play,
  selectedCount,
  onConfirm,
  onScore,
}: {
  handPhase: HandPhase
  play: Play
  selectedCount: number
  onConfirm: () => void
  onScore: () => void
}) {
  const { canConfirm, canScore } = useRunFlags(handPhase, play)
  return (
    <ActionBar
      handPhase={handPhase}
      canConfirm={canConfirm}
      canScore={canScore}
      selectedCount={selectedCount}
      onConfirm={onConfirm}
      onScore={onScore}
    />
  )
}

/** The top bar: blind header + save button. */
function RunTop({ onSave }: { onSave: () => void }) {
  return (
    <div className="run-top">
      <BlindHeader />
      <SaveButton onSave={onSave} />
    </div>
  )
}

export function RunScreen() {
  const hand = useRunStore((s) => s.hand)
  const play = useRunStore((s) => s.play)
  const handPhase = useRunStore((s) => s.handPhase)
  const lastScore = useRunStore((s) => s.lastScore)
  const blindIndex = useRunStore((s) => s.blindIndex)
  const charms = useRunStore((s) => s.charms)
  const unpickCoin = useRunStore((s) => s.unpickCoin)
  const score = useRunStore((s) => s.score)
  const save = useRunStore((s) => s.save)
  const wellRef = useRef<HTMLDivElement>(null)
  const deals = useDeals(hand, play)
  const selection = useCoinSelection(handPhase === 'play') // 13a.5 multi-select
  const onUnpick = useUnpickSfx(unpickCoin) // 13.7 — the unpick click (UX §10)
  const flow = useHandFlow(hand, play, wellRef, selection, (i) => onUnpick(i))
  useAutoDraw()
  const flags = useRunFlags(handPhase, play)
  const choro = useScoringChoro(score)
  useAutoScore(handPhase, play, choro.handleScore) // 13a.1/13a.7 — an idle buff never waits for a Score click
  useHandShortcuts(hand, play, handPhase, selection, flow.pickOne, flow.handleConfirm, choro.handleScore) // 13a.5
  const onBackgroundClick = useBackgroundClear(selection) // 13a.5 — empty-space click clears
  // 13a.7 — the live projected total (the boss rule applies, as in score()).
  const blind = BLINDS[blindIndex]
  const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
  const projection = useTossProjection(handPhase, play, boss, charms)
  return (
    <main className="run-screen" onClick={onBackgroundClick}>
      <RunTop onSave={save} />
      <OnboardingHint /> // 13a.10 — first-run hint (overlay, never blocks input)
      <CharmBar />
      <PlayAreaHost
        play={play} hand={hand} revealed={flags.revealed} canPick={flags.canPick}
        shake={flow.shake} deals={deals} wellRef={wellRef} selection={selection}
        onPick={flow.handleHandTap} onDiscard={flow.discardOne} onUnpick={flow.handleUnpick}
        onDropToPlay={flow.handleDropToPlay} onDropToDiscard={flow.handleDropToDiscard} onMovePlay={flow.handleMovePlay}
        onQuickPlay={flow.handleQuickPlay} onHover={flow.onCoinHover} onHoverEnd={flow.onCoinHoverEnd}
        registerRef={flow.registerCoin} onQuickDiscard={flow.handleQuickDiscard} getReflip={flags.getReflip}
      />
      <ScoreTicker
        score={lastScore}
        projection={projection}
        choro={choro.seq ? { runId: choro.seq.runId, beat: choro.beat, skipped: choro.skipped } : null}
        chipsRef={choro.chipsRef}
        cashRef={choro.cashRef}
      />
      <RunActions
        handPhase={handPhase}
        play={play}
        selectedCount={selection.selected.size}
        onConfirm={flow.handleConfirm}
        onScore={choro.handleScore}
      />
      <RunPortals ghosts={flow.ghosts} removeGhost={flow.removeGhost} choro={choro} />
    </main>
  )
}
