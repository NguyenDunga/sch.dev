// M5 — pattern / tier matching (split from scoring.ts, 150-LOC file rule):
// matchTier(play, boss) → the highest-value tier matched by the tossed coins,
// or `none`.

import { isFilled, none, some } from '../helpers'
import type { BossRuleId, Face, Option, Play, TierId } from '../types'

/**
 * M5: highest-value tier matched by the tossed coins, or `none`.
 *
 * Empty slots count as nothing — the pattern is read on the filled slots' faces
 * only, so a k-coin play can only match tiers that fit in k. Tiers in priority
 * order (high → low): jackpot, fourRow, alternating, fourSame, tripleRun, threeSame.
 *
 * Boss rules apply here:
 *   - noAlternating → an alternating play returns `none` (explicit override, no fall-through)
 *   - noJackpots    → a jackpot play returns `fourSame` (fixed demotion, not a fall-through to fourRow)
 */
export function matchTier(play: Play, boss: Option<BossRuleId>): Option<TierId> {
  const faces = play.filter(isFilled).map((s) => s.face)
  const n = faces.length
  if (n <= 2) return none

  // Count + run stats over the two faces.
  const counts: Record<Face, number> = { H: 0, T: 0 }
  let maxRun = 1
  let run = 1
  for (let i = 0; i < n; i++) {
    counts[faces[i]]++
    run = i > 0 && faces[i] === faces[i - 1] ? run + 1 : 1
    maxRun = Math.max(maxRun, run)
  }
  const maxCount = Math.max(counts.H, counts.T)
  const isAlternating = n === 5 && faces.every((f, i) => i === 0 || f !== faces[i - 1])

  // 1. jackpot — exactly 5 faces, all identical.
  if (n === 5 && maxCount === 5) {
    return boss.some && boss.value === 'noJackpots' ? some('fourSame') : some('jackpot')
  }
  // 2. fourRow — a run of ≥4 adjacent equal faces.
  if (maxRun >= 4) return some('fourRow')
  // 3. alternating — exactly 5 strictly alternating faces.
  if (isAlternating) {
    return boss.some && boss.value === 'noAlternating' ? none : some('alternating')
  }
  // 4. fourSame — some face appears ≥4 times, not necessarily adjacent.
  if (maxCount >= 4) return some('fourSame')
  // 5. tripleRun — a run of ≥3 adjacent equal faces.
  if (maxRun >= 3) return some('tripleRun')
  // 6. threeSame — a face appears exactly 3 times.
  if (maxCount === 3) return some('threeSame')
  return none
}
