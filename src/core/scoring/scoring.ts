// C3 — Scoring pipeline: matchTier (M5, match-tier.ts) → scoreHand (M6:
// tier → base → upgrades → boosters → total + coin cash) → projectScore
// (13a.7). resolveFace (M7) lives in resolve-face.ts (150-LOC file rule).
//
// Coin effects (v1 core set of 11):
//   Face (resolveFace): weight, heads, tails, chaos, magnetic, reverse
//   Cash (scoreHand step 5): tax +cash/coin, jackpot +cash/coin (chance roll)
//   Draw / re-flip (store-driven): draw (redraw N), echo (one re-flip)
// Behavior params come from the coin/charm registries (src/config).
//
// Source of truth: public/.docs/sdd/software_design_component.md (C3).

import type { Rng } from '../rng'
import { chance } from '../rng'
import { isFilled } from '../helpers'
import { TIERS, zeroTierUpgrades } from '../balance'
import { COIN_EFFECTS } from '@/config/coins'
import { CHARMS } from '@/config/charms'
import type { BossRuleId, CharmId, Option, Play, Score, TierId, TierUpgrades } from '../types'
import { matchTier } from './match-tier'

// resolveFace (M7) + matchTier (M5) live in their own files (150-LOC rule).
export { resolveFace } from './resolve-face'
export { matchTier } from './match-tier'

// Coin cash + booster params — from the config registries (src/config).
const TAX_PAYOUT = COIN_EFFECTS.tax.params.payout ?? 0
const JACKPOT_CHANCE = COIN_EFFECTS.jackpot.params.chance ?? 0
const JACKPOT_PAYOUT = COIN_EFFECTS.jackpot.params.payout ?? 0

/**
 * M6: the exact scoring pipeline, in order, no steps merged.
 *   1. Tier     — matchTier(play, boss) (boss tier rules applied inside M5)
 *   2. Base     — {chips, mult} from TIERS; no tier → {0, 0}
 *   2.5 Upgrades — M22: the matched tier's purchased chips/mult (tierUpgrades);
 *                  applied after the base, before the boosters (boosters
 *                  compound on the upgraded values)
 *   3. Boosters — charms left→right: plusChips +10 chips, plusMult +1 mult,
 *                 jackpotFever ×2 chips (jackpot tier only); only these three
 *   4. Score    — total = chips × mult (0 for a no-tier hand)
 *   5. Coin cash — $1 per Tax coin (deterministic) + $4 per Jackpot coin
 *                 passing its 25% roll (rng, never Math.random); paid to cash,
 *                 outside chips × mult
 */
/** M6 steps 1–4 (tier → base → upgrades → boosters → total) — the
 *  deterministic part of the pipeline (no rng). `scoreHand` adds step 5 (coin
 *  cash) on top; the 13a.7 projection reuses this so auto and manual scores
 *  agree exactly. */
function tierScore(
  play: Play,
  boss: Option<BossRuleId>,
  charms: CharmId[],
  tierUpgrades: TierUpgrades,
): { tier: TierId | null; chips: number; mult: number; total: number } {
  // 1. Tier (boss rules already applied inside matchTier)
  const tierOpt = matchTier(play, boss)
  const tier = tierOpt.some ? tierOpt.value : null

  // 2. Base
  const base = tier ? TIERS.find((t) => t.id === tier) : undefined
  let chips = base?.chips ?? 0
  let mult = base?.mult ?? 0

  // 2.5 Tier upgrades (M22): the matched tier's purchased chips/mult — after
  // the base, before the boosters (so the boosters compound on top).
  if (tier) {
    chips += tierUpgrades[tier].chips
    mult += tierUpgrades[tier].mult
  }

  // 3. Boosters, left→right, only the three scoring boosters (params from
  //    the charm registry, src/config/charms)
  for (const charm of charms) {
    const p = CHARMS[charm].params
    if (charm === 'plusChips') chips += p.chips ?? 0
    else if (charm === 'plusMult') mult += p.mult ?? 0
    else if (charm === 'jackpotFever' && tier === 'jackpot') chips *= p.chipsMult ?? 1
  }

  // 4. Score
  const total = tier ? chips * mult : 0
  return { tier, chips, mult, total }
}

export function scoreHand(
  play: Play,
  boss: Option<BossRuleId>,
  charms: CharmId[],
  rng: Rng,
  tierUpgrades: TierUpgrades = zeroTierUpgrades(),
): Score {
  const { tier, chips, mult, total } = tierScore(play, boss, charms, tierUpgrades)

  // 5. Coin cash (per coin in the play; a merged coin carries both effects)
  let cash = 0
  for (const slot of play) {
    if (!isFilled(slot)) continue
    for (const effect of slot.coin.effects) {
      if (effect.kind === 'tax') cash += TAX_PAYOUT
      else if (effect.kind === 'jackpot' && chance(rng, JACKPOT_CHANCE)) cash += JACKPOT_PAYOUT
    }
  }

  return tier ? { kind: 'scored', tier, chips, mult, total, cash } : { kind: 'none', cash }
}

/**
 * 13a.7 — the projected score: the deterministic pipeline (M6 steps 1–4) over
 *  the first `landed` tossed coins — the pattern that has emerged so far as
 *  the coins land left→right. The play is locked (faces resolved at confirm),
 *  so the projection is deterministic and matches the real score's
 *  chips × mult = total exactly (M13 §0); only the coin cash (step 5 — the
 *  Jackpot 25% roll) is left to the real score, so the projection's cash is 0.
 *  `landed` clamps to the number of filled slots (0..n).
 */
export function projectScore(
  play: Play,
  boss: Option<BossRuleId>,
  charms: CharmId[],
  landed: number,
  tierUpgrades: TierUpgrades = zeroTierUpgrades(),
): Score {
  const filled = play.filter(isFilled)
  const n = Math.max(0, Math.min(landed, filled.length))
  const { tier, chips, mult, total } = tierScore(filled.slice(0, n), boss, charms, tierUpgrades)
  return tier ? { kind: 'scored', tier, chips, mult, total, cash: 0 } : { kind: 'none', cash: 0 }
}
