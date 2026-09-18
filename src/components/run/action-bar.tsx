// Action bar (C6) — the bottom controls of the run screen. Play phase: the
// explicit Confirm (play → toss). Buff phase: the explicit Score (buff →
// score). No auto-score timer (SDD C6). 13a.6: the Discard mode toggle is
// gone — discard is the well drop or the per-coin D key. Uses the themed
// Button (full state set, UX §3).

import type { HandPhase } from '@/core/types'
import { Button } from '@/components/ui/button'
import { ACTION_ICONS } from '@/lib/icons'

interface ActionBarProps {
  handPhase: HandPhase
  canConfirm: boolean
  canScore: boolean
  /** 13a.5: the multi-selection count (a "N selected" hint). */
  selectedCount: number
  onConfirm: () => void
  onScore: () => void
}

export function ActionBar({ handPhase, canConfirm, canScore, selectedCount, onConfirm, onScore }: ActionBarProps) {
  const ConfirmIcon = ACTION_ICONS.confirm.icon
  const ScoreIcon = ACTION_ICONS.score.icon
  return (
    <div className="action-bar">
      {handPhase === 'play' && (
        <>
          {selectedCount > 0 && (
            <span className="selection-hint" role="status">
              {selectedCount} selected
            </span>
          )}
          <Button size="xl" pulse={canConfirm} disabled={!canConfirm} onClick={onConfirm}>
            <ConfirmIcon size={20} strokeWidth={2.5} aria-hidden />
            Confirm
          </Button>
        </>
      )}
      {handPhase === 'buff' && (
        <Button size="xl" pulse disabled={!canScore} onClick={onScore}>
          <ScoreIcon size={20} strokeWidth={2.5} aria-hidden />
          Score
        </Button>
      )}
    </div>
  )
}
