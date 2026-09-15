// C9 — Run-end screen: win/lose, the run summary (blinds cleared, total run
// score, final cash), the seed (for sharing/replay), and the Menu / New Run
// buttons. Reads RunState; the summary numbers come straight from the store.

import { useEffect } from 'react'
import { BLINDS } from '@/core/balance'
import { useRunStore } from '@/state/runStore'
import { Button } from '@/components/ui/button'
import { playSfx } from '@/components/juice/sfx'

const BLIND_NAMES = { small: 'Small', big: 'Big', boss: 'Boss' } as const

/** 13.7 — the game-over stinger (UX §10); a win already got the blind-clear
 *  stinger on the shop transition. */
function useLoseStinger(won: boolean) {
  useEffect(() => {
    if (!won) playSfx('loseStinger')
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
  useLoseStinger(won)

  const blind = BLINDS[blindIndex]
  // Blinds cleared: all 12 on a win, otherwise the index of the blind lost
  // (blinds 0..blindIndex-1 are cleared).
  const blindsCleared = won ? BLINDS.length : blindIndex

  return (
    <main className="run-end">
      <div className="run-end-head">
        <h1 className="run-end-title">{won ? 'Run complete!' : 'Game over'}</h1>
        <p className="run-end-sub">
          {won
            ? `All ${BLINDS.length} blinds cleared · final ${blindScore} / ${blind.target}`
            : `Round ${blind.round} · ${BLIND_NAMES[blind.kind]} blind · ${blindScore} / ${blind.target}`}
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
