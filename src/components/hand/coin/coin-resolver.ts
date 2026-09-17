// Coin face resolver — delegates to per-effect resolvers in effects/.
//
// Each effect has its own sub-directory with config + resolver + test.
// The main resolver sorts effects by priority and applies them in order.
//
// Pure function: same input → same output. No side effects.

import type { CoinEffect, Face } from '@/core/types'
import type { CoinVisualModifier, ResolvedCoinFace, ResolverInput } from './coin-types'
import {
  resolveWeight, resolveHeads, resolveTails, resolveFacedown, resolveChaos, resolveEcho,
  resolveMagnetic, resolveReverse, resolveTax, resolveJackpot, resolveDraw,
} from './effects'

// ── Base face colors ─────────────────────────────────────────────────────────

function baseColor(face: Face | undefined): string {
  if (face === 'H') return 'var(--heads)'
  if (face === 'T') return 'var(--tails)'
  return 'var(--surface-sunk)' // face-down
}

// ── Priority map (from each effect's config) ─────────────────────────────────

import {
  WEIGHT_META, HEADS_META, TAILS_META, FACEDOWN_META, CHAOS_META, ECHO_META,
  MAGNETIC_META, REVERSE_META, TAX_META, JACKPOT_META, DRAW_META,
} from './effects'

const PRIORITY: Record<CoinEffect['kind'], number> = {
  weight: WEIGHT_META.priority,
  heads: HEADS_META.priority,
  tails: TAILS_META.priority,
  facedown: FACEDOWN_META.priority,
  chaos: CHAOS_META.priority,
  echo: ECHO_META.priority,
  magnetic: MAGNETIC_META.priority,
  reverse: REVERSE_META.priority,
  tax: TAX_META.priority,
  jackpot: JACKPOT_META.priority,
  draw: DRAW_META.priority,
}

// ── Dispatch to the per-effect resolver ──────────────────────────────────────

function effectToModifier(effect: CoinEffect, face: Face | undefined): CoinVisualModifier {
  switch (effect.kind) {
    case 'weight': return resolveWeight(effect, face)
    case 'heads': return resolveHeads(face)
    case 'tails': return resolveTails(face)
    case 'facedown': return resolveFacedown(face)
    case 'chaos': return resolveChaos()
    case 'echo': return resolveEcho()
    case 'magnetic': return resolveMagnetic()
    case 'reverse': return resolveReverse()
    case 'tax': return resolveTax()
    case 'jackpot': return resolveJackpot()
    case 'draw': return resolveDraw(effect)
  }
}

// ── The chain resolver ───────────────────────────────────────────────────────

export function resolveCoinFace(input: ResolverInput): ResolvedCoinFace {
  const { face, effects } = input

  let color = baseColor(face)
  let border = ''
  let glow = ''
  let glyphOverride: string | undefined
  const customClasses: string[] = []
  const modifiers: CoinVisualModifier[] = []

  const sorted = [...effects].sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])

  for (const effect of sorted) {
    const mod = effectToModifier(effect, face)
    modifiers.push(mod)
    if (mod.color !== undefined) color = mod.color
    if (mod.border !== undefined) border = mod.border
    if (mod.glow !== undefined) glow = mod.glow
    if (mod.customClass !== undefined) customClasses.push(mod.customClass)
    if (mod.glyphOverride !== undefined) glyphOverride = mod.glyphOverride
  }

  return { face, modifiers, color, border, glow, glyphOverride, customClasses }
}

export function resolveCoinFaces(effects: CoinEffect[]): { H: ResolvedCoinFace; T: ResolvedCoinFace } {
  return {
    H: resolveCoinFace({ face: 'H', effects }),
    T: resolveCoinFace({ face: 'T', effects }),
  }
}

/**
 * The highest-priority effect on a coin (the RadialReveal disk's default glyph).
 * Ties break by list order (first wins). `undefined` when there are no effects.
 */
export function highestPriorityEffect(effects: CoinEffect[]): CoinEffect | undefined {
  if (effects.length === 0) return undefined
  return [...effects].sort((a, b) => PRIORITY[b.kind] - PRIORITY[a.kind])[0]
}
