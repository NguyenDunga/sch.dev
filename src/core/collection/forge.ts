// Forge (13a.14) — the special merge interactions.
//
// Merging two coins normally just stacks the effects (the target gains the
// source's effects). These rules are the exceptions: when a pair of effects
// (one from each coin) matches a rule, the pair is consumed and replaced by
// the rule's result (or nothing, for plain cancellations); every other
// effect carries over. One rule fires per merge — the first match in table
// order.
//
// Data + pure logic only: the merge itself is the store's mergeCoin (which
// charges FORGE_COST and calls forgeCoin), and the UI preview reuses the
// same functions.

import type { Coin, CoinEffect, DrawCount } from '../types'

/** One special interaction: a matching pair of effects (one from each coin)
 *  is consumed and replaced by `result` (null = plain, the pair just
 *  cancels). */
export interface ForgeRule {
  matches: (a: CoinEffect, b: CoinEffect) => boolean
  result: (a: CoinEffect, b: CoinEffect) => CoinEffect | null
}

/** The starter set (13a.14 Q&A): draw stacks (cap 3), weight pairs
 *  (certainty / cancel), opposing certainties → chaos, chaos + reverse
 *  cancel to plain, tax stacks into jackpot. */
export const FORGE_RULES: ForgeRule[] = [
  // Draw-N + Draw-M → Draw-(N+M), capped at 3.
  {
    matches: (a, b) => a.kind === 'draw' && b.kind === 'draw',
    result: (a, b) =>
      a.kind === 'draw' && b.kind === 'draw'
        ? { kind: 'draw', count: Math.min(3, a.count + b.count) as DrawCount }
        : null,
  },
  // Weight(H) + Weight(H) → Heads (two aligned leans become certainty).
  {
    matches: (a, b) => a.kind === 'weight' && b.kind === 'weight' && a.favored === 'H' && b.favored === 'H',
    result: () => ({ kind: 'heads' }),
  },
  // Weight(T) + Weight(T) → Tails.
  {
    matches: (a, b) => a.kind === 'weight' && b.kind === 'weight' && a.favored === 'T' && b.favored === 'T',
    result: () => ({ kind: 'tails' }),
  },
  // Weight(H) + Weight(T) → plain (opposing leans cancel).
  {
    matches: (a, b) => a.kind === 'weight' && b.kind === 'weight' && a.favored !== b.favored,
    result: () => null,
  },
  // Heads + Tails → Chaos (opposing certainties collapse into randomness).
  {
    matches: (a, b) =>
      (a.kind === 'heads' && b.kind === 'tails') || (a.kind === 'tails' && b.kind === 'heads'),
    result: () => ({ kind: 'chaos' }),
  },
  // Chaos + Chaos → plain (two wilds average out to neutral).
  {
    matches: (a, b) => a.kind === 'chaos' && b.kind === 'chaos',
    result: () => null,
  },
  // Reverse + Reverse → plain (double inversion = identity).
  {
    matches: (a, b) => a.kind === 'reverse' && b.kind === 'reverse',
    result: () => null,
  },
  // Tax + Tax → Jackpot (stacking upgrades to the bigger cash effect).
  {
    matches: (a, b) => a.kind === 'tax' && b.kind === 'tax',
    result: () => ({ kind: 'jackpot' }),
  },
]

/** What a merge produces: the resulting effects + which rule fired (if any). */
export interface ForgeOutcome {
  effects: CoinEffect[]
  /** The matched pair + rule, when a special fired (the UI preview shows it). */
  special: { rule: ForgeRule; a: CoinEffect; b: CoinEffect } | null
}

/**
 * The forge result for merging `source` into `target`:
 * - a matching effect pair (one from each coin) is consumed and replaced by
 *   the rule's result; every other effect carries over (target order first);
 * - no match → the plain stack (target's effects + the source's).
 */
export function forgeCoin(source: Coin, target: Coin): ForgeOutcome {
  for (const rule of FORGE_RULES) {
    const ai = source.effects.findIndex((ea) => target.effects.some((eb) => rule.matches(ea, eb)))
    if (ai === -1) continue
    const a = source.effects[ai]
    const bi = target.effects.findIndex((eb) => rule.matches(a, eb))
    const b = target.effects[bi]
    const rest = [
      ...target.effects.filter((_, i) => i !== bi),
      ...source.effects.filter((_, i) => i !== ai),
    ]
    const result = rule.result(a, b)
    return { effects: result ? [result, ...rest] : rest, special: { rule, a, b } }
  }
  return { effects: [...target.effects, ...source.effects], special: null }
}

// -- UI labels -----------------------------------------------------------------

/** A short name for an effect (the forge preview's rule line). */
export function effectName(e: CoinEffect): string {
  switch (e.kind) {
    case 'weight':
      return `Weight(${e.favored})`
    case 'draw':
      return `Draw-${e.count}`
    case 'magnetic':
      return 'Magnetic'
    case 'echo':
      return 'Echo'
    default:
      return e.kind.charAt(0).toUpperCase() + e.kind.slice(1)
  }
}

/** The preview line for a fired rule, e.g. "Draw-1 + Draw-1 → Draw-2". */
export function forgeRuleLabel(rule: ForgeRule, a: CoinEffect, b: CoinEffect): string {
  const r = rule.result(a, b)
  return `${effectName(a)} + ${effectName(b)} → ${r ? effectName(r) : 'plain'}`
}
