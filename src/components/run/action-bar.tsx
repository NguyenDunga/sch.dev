// Action bar (C6) — the bottom controls of the run screen. Play phase: a
// Discard mode toggle + the explicit Confirm (play → toss). Buff phase: the
// explicit Score (buff → score). No auto-score timer (SDD C6). Uses the themed
// Button (full state set, UX §3).

import type { HandPhase } from '@/core/types'
import { Button } from '@/components/ui/button'

interface ActionBarProps {
  handPhase: HandPhase
  discardMode: boolean
  canConfirm: boolean
  canScore: boolean
  onToggleDiscard: () => void
  onConfirm: () => void
  onScore: () => void
}

export function ActionBar({
  handPhase,
  discardMode,
  canConfirm,
  canScore,
  onToggleDiscard,
  onConfirm,
  onScore,
}: ActionBarProps) {
  return (
    <div className="action-bar">
      {handPhase === 'play' && (
        <>
          <Button
            variant={discardMode ? 'destructive' : 'outline'}
            size="lg"
            aria-pressed={discardMode}
            onClick={onToggleDiscard}
          >
            {discardMode ? 'Discarding' : 'Discard'}
          </Button>
          <Button size="xl" pulse={canConfirm} disabled={!canConfirm} onClick={onConfirm}>
            Confirm
          </Button>
        </>
      )}
      {handPhase === 'buff' && (
        <Button size="xl" pulse disabled={!canScore} onClick={onScore}>
          Score
        </Button>
      )}
    </div>
  )
}
