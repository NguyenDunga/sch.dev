// C6 — Run screen: the full hand flow (draw → play → toss → buff → score).
// UI is a thin layer — it reads RunState and calls store actions; juice
// never mutates state (UX §0). The screen is split across this module
// (150-LOC file rule): hand-row / play-area / run-portals (the views) and
// hooks/ (the flows).

import { useRef } from 'react'
import { BLINDS } from '@/core/balance'
import { none, some } from '@/core/helpers'
import type { BossRuleId, HandPhase, Option, Play } from '@/core/types'
import { useRunStore } from '@/state/runStore'
import { useCoinSelection } from '@/components/hand/coin-dnd'
import { ScoreTicker } from '@/components/hand/score-ticker/score-ticker'
import { BlindHeader } from '@/components/run/blind-header'
import { ActionBar } from '@/components/run/action-bar'
import { SaveButton } from '@/components/run/save-button'
import { WikiButton } from '@/components/wiki/wiki-button'
import { CharmBar } from '@/components/charm-bar/charm-bar'
import { TierReference } from '@/components/run/tier-reference/tier-reference'
import { useTossLanding } from './hooks/use-toss-landing'
import { useHandShortcuts } from './hooks/use-hand-shortcuts'
import {
  useAutoDraw,
  useBackgroundClear,
  useDeals,
  useFinishOnSettle,
  useRunFlags,
  useScoringChoro,
  useUnpickSfx,
} from './hooks/use-run-hooks'
import { useHandFlow } from './hooks/use-hand-flow'
import { PlayAreaHost } from './play-area'
import { RunPortals } from './run-portals'

// M23 — responsive topology (mobile-first; base = phone, single column).
const RUN_SCREEN_CLASSES = [
  'run-screen',
  'md:max-w-[52rem]', // md (tablet/laptop): widened single column
  'lg:max-w-[72rem] lg:grid-cols-[minmax(14rem,20rem)_1fr]', // lg: left rail + play column
  'lg:grid-rows-[auto_minmax(0,1fr)_auto_auto_auto]',
  "lg:[grid-template-areas:'header_header_score_play_charms_play_tiers_play_actions_actions']",
  'landscape-short:gap-2', // landscape phone: compact vertical rhythm
].join(' ')

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

/** The top bar: blind header + wiki ("?") + save button. */
function RunTop({ onSave }: { onSave: () => void }) {
  return (
    <div className="run-top">
      <BlindHeader />
      <div className="run-top-actions">
        <WikiButton />
        <SaveButton onSave={onSave} />
      </div>
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
  const tierUpgrades = useRunStore((s) => s.tierUpgrades)
  const unpickCoin = useRunStore((s) => s.unpickCoin)
  const score = useRunStore((s) => s.score)
  const finishScore = useRunStore((s) => s.finishScore)
  const save = useRunStore((s) => s.save)
  const wellRef = useRef<HTMLDivElement>(null)
  const deals = useDeals(hand, play)
  const selection = useCoinSelection(handPhase === 'play') // 13a.5 multi-select
  const onUnpick = useUnpickSfx(unpickCoin) // 13.7 — the unpick click (UX §10)
  const flow = useHandFlow(hand, play, wellRef, selection, (i) => onUnpick(i))
  useAutoDraw()
  const flags = useRunFlags(handPhase, play)
  const choro = useScoringChoro(score)
  // Async hand flow: advance the hand (deal the next / end the blind) only
  // once the scoring choreography settles (beat 7).
  useFinishOnSettle(choro, finishScore)
  useHandShortcuts(hand, play, handPhase, selection, flow.pickOne, flow.handleConfirm, choro.handleScore) // 13a.5
  const onBackgroundClick = useBackgroundClear(selection) // 13a.5 — empty-space click clears
  // 13a.7 — the live projected total (the boss rule applies, as in score()).
  const blind = BLINDS[blindIndex]
  const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
  // 13b.8 — the toss timing glue (projection + whoosh sfx + auto-score) is
  // driven by the toss animation's landing events (onLand), not setTimeout.
  const projection = useTossLanding(handPhase, play, boss, charms, tierUpgrades, choro.handleScore)
  return (
    <main className={RUN_SCREEN_CLASSES} onClick={onBackgroundClick}>
      <RunTop onSave={save} />
      <ScoreTicker
        score={lastScore}
        projection={projection}
        reset={handPhase !== 'score'}
        choro={choro.seq ? { runId: choro.seq.runId, beat: choro.beat, skipped: choro.skipped } : null}
        chipsRef={choro.chipsRef}
        cashRef={choro.cashRef}
      />
      <CharmBar />
      <TierReference />
      <PlayAreaHost
        play={play} hand={hand} revealed={flags.revealed} canPick={flags.canPick}
        shake={flow.shake} deals={deals} wellRef={wellRef} selection={selection}
        onPick={flow.handleHandTap} onDiscard={flow.discardOne} onUnpick={flow.handleUnpick}
        onDropToPlay={flow.handleDropToPlay} onDropToDiscard={flow.handleDropToDiscard} onMovePlay={flow.handleMovePlay}
        onQuickPlay={flow.handleQuickPlay} onWellTap={flow.handleWellTap}
        registerRef={flow.registerCoin} getReflip={flags.getReflip}
        onLand={projection ? projection.handleLand : () => {}}
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
