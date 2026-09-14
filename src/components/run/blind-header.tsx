// Blind header (C6) — the top bar of the run screen: the current blind's
// round + name (Small/Big/Boss + boss rule), the target (Heavy Target ×1.5 at
// runtime), the running blindScore, hands left, and the draw/discard pile
// counts. Reads RunState; no game logic.

import { BLINDS, BOSS_RULES, HEAVY_TARGET_MULT } from '@/core/balance'
import { useRunStore } from '@/state/runStore'

const BLIND_NAMES = { small: 'Small', big: 'Big', boss: 'Boss' } as const

/** The blind's effective target (Heavy Target ×1.5 at runtime). */
function effectiveTarget(blindIndex: number): number {
  const blind = BLINDS[blindIndex]
  if (blind.kind === 'boss' && blind.rule === 'heavyTarget') {
    return Math.round(blind.target * HEAVY_TARGET_MULT)
  }
  return blind.target
}

export function BlindHeader() {
  const blindIndex = useRunStore((s) => s.blindIndex)
  const blindScore = useRunStore((s) => s.blindScore)
  const handsLeft = useRunStore((s) => s.handsLeft)
  const drawCount = useRunStore((s) => s.deck.drawPile.length)
  const discardCount = useRunStore((s) => s.deck.discardPile.length)

  const blind = BLINDS[blindIndex]
  const bossRule = blind.kind === 'boss' ? BOSS_RULES.find((r) => r.id === blind.rule) : undefined
  const target = effectiveTarget(blindIndex)
  const met = blindScore >= target

  return (
    <header className="blind-header" aria-label="Blind">
      <div className="blind-header-id">
        <span className="blind-header-round">Round {blind.round}</span>
        <span className="blind-header-name">
          {BLIND_NAMES[blind.kind]}
          {bossRule ? ` · ${bossRule.name}` : ''}
        </span>
      </div>
      <div className="blind-header-score" aria-live="polite">
        <span className={`blind-header-value${met ? ' blind-header-value--met' : ''}`}>{blindScore}</span>
        <span className="blind-header-target">/ {target}</span>
      </div>
      <div className="blind-header-stats">
        <span className="blind-header-stat" title="Hands left this blind">
          <strong>{handsLeft}</strong> hands
        </span>
        <span className="blind-header-stat" title="Coins in the draw pile">
          <strong>{drawCount}</strong> draw
        </span>
        <span className="blind-header-stat" title="Coins in the discard pile">
          <strong>{discardCount}</strong> disc
        </span>
      </div>
    </header>
  )
}
