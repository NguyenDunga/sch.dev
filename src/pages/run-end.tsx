// C9 — Run-end screen: win/lose, the run summary (blinds cleared, total run
// score, final cash), the seed (for sharing/replay), and the Menu / New Run
// buttons. Reads RunState; the summary numbers come straight from the store.
//
// Win scene (13.9): a won run gets the trophy + a one-shot celebration on
// mount — a big confetti burst (the app-root ParticleLayer renders it) + the
// win stinger. The celebration is error-proof by construction (UX §9):
//   - fires exactly once (ref guard — StrictMode double-mount safe)
//   - emitConfetti is a no-op without a canvas layer (draw() guards !ctx)
//   - playSfx never throws (a missing asset or blocked AudioContext = silence)
//   - no timers / external state of its own (the particle engine owns its rAF)

import { useEffect, useRef } from 'react'
import { FaTrophy } from 'react-icons/fa6'
import { BLINDS, HEAVY_TARGET_MULT } from '@/core/balance'
import { useRunStore } from '@/state/runStore'
import { Button } from '@/components/ui/button'
import { withIcon } from '@/components/ui/icon'
import { emitConfetti } from '@/components/juice/particles'
import { playSfx } from '@/components/juice/sfx'

const BLIND_NAMES = { small: 'Small', big: 'Big', boss: 'Boss' } as const

/** The blind's effective target (Heavy Target boss × 1.5 — same as BlindHeader). */
function effectiveTarget(blind: (typeof BLINDS)[number]): number {
  return blind.kind === 'boss' && blind.rule === 'heavyTarget' ? blind.target * HEAVY_TARGET_MULT : blind.target
}

const TrophyIcon = withIcon(FaTrophy)

/** 13.7/13.9 — the end-of-run stingers (UX §10): the lose stinger on a loss;
 *  the win stinger + the one-shot confetti burst on a win (the blind-clear
 *  confetti only fires on run → shop, so the final win gets its own). */
function useEndCelebration(won: boolean) {
  const firedRef = useRef(false)
  useEffect(() => {
    if (firedRef.current) return // exactly once (StrictMode double-mount safe)
    firedRef.current = true
    if (won) {
      emitConfetti({ count: 300 })
      playSfx('winStinger')
    } else {
      playSfx('loseStinger')
    }
  }, [won])
}

export function RunEndScreen() {
  const seed = useRunStore((s) => s.seed)
  const won = useRunStore((s) => s.won)
  const blindIndex = useRunStore((s) => s.blindIndex)
  const blindScore = useRunStore((s) => s.blindScore)
  const runScore = useRunStore((s) => s.runScore)
  const cash = useRunStore((s) => s.cash)
  const toMenu = useRunStore((s) => s.toMenu)
  const startRun = useRunStore((s) => s.startRun)
  useEndCelebration(won)

  const blind = BLINDS[blindIndex]
  // Blinds cleared: all 12 on a win, otherwise the index of the blind lost
  // (blinds 0..blindIndex-1 are cleared).
  const blindsCleared = won ? BLINDS.length : blindIndex

  return (
    <main className={`run-end md:max-w-[36rem]${won ? ' run-end--win' : ''}`}>
      <div className="run-end-head">
        {won && <TrophyIcon className="run-end-trophy" size={64} aria-hidden />}
        <h1 className="run-end-title">{won ? 'Run complete!' : 'Game over'}</h1>
        <p className="run-end-sub">
          {won
            ? `All ${BLINDS.length} blinds cleared · final ${blindScore} / ${effectiveTarget(blind)}`
            : `Round ${blind.round} · ${BLIND_NAMES[blind.kind]} blind · ${blindScore} / ${effectiveTarget(blind)}`}
        </p>
      </div>

      <dl className="run-summary">
        <div className="run-summary-row">
          <dt>Blinds cleared</dt>
          <dd>
            {blindsCleared} / {BLINDS.length}
          </dd>
        </div>
        <div className="run-summary-row">
          <dt>Run score</dt>
          <dd>{runScore}</dd>
        </div>
        <div className="run-summary-row">
          <dt>Cash</dt>
          <dd>${cash}</dd>
        </div>
      </dl>

      <p className="run-end-seed">
        seed: <code>{seed}</code>
      </p>

      <div className="run-end-actions">
        <Button size="lg" pulse onClick={() => startRun()}>
          New Run
        </Button>
        <Button variant="outline" size="lg" onClick={toMenu}>
          Menu
        </Button>
      </div>
    </main>
  )
}
