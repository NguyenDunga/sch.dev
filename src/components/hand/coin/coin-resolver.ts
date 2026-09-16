// Coin face resolver — delegates to per-effect resolvers in effects/.
//
// Each effect has its own sub-directory with config + resolver + test.
// The main resolver sorts effects by priority and applies them in order.
//
// Pure function: same input → same output. No side effects.

import type { CoinEffect, Face } from '@/core/types'
import type { CoinVisualModifier, ResolvedCoinFace, ResolverInput } from './coin-types'
import {
  resolveWeight, resolveDoubleSide, resolveChaos, resolveEcho,
  resolveMagnetic, resolveReverse, resolveTax, resolveJackpot, resolveDraw,
} from './effects'

// ── Base face colors ─────────────────────────────────────────────────────────

const BASE_COLORS: Record<Face, string> = {
  H: 'var(--heads)',
  T: 'var(--tails)',
}

// ── Priority map (from each effect's config) ─────────────────────────────────

import {
  WEIGHT_META, DOUBLE_SIDE_META, CHAOS_META, ECHO_META,
  MAGNETIC_META, REVERSE_META, TAX_META, JACKPOT_META, DRAW_META,
} from './effects'

const PRIORITY: Record<CoinEffect['kind'], number> = {
  weight: WEIGHT_META.priority,
  doubleSide: DOUBLE_SIDE_META.priority,
  chaos: CHAOS_META.priority,
  echo: ECHO_META.priority,
  magnetic: MAGNETIC_META.priority,
  reverse: REVERSE_META.priority,
  tax: TAX_META.priority,
  jackpot: JACKPOT_META.priority,
  draw: DRAW_META.priority,
}

// ── Dispatch to the per-effect resolver ──────────────────────────────────────

function effectToModifier(effect: CoinEffect, face: Face): CoinVisualModifier {
  switch (effect.kind) {
    case 'weight': return resolveWeight(effect, face)
    case 'doubleSide': return resolveDoubleSide(effect, face)
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

  let color = BASE_COLORS[face]
  let tilt = 0
  let scale = 1
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
    if (mod.tilt !== undefined) tilt += mod.tilt
    if (mod.scale !== undefined) scale *= mod.scale
    if (mod.border !== undefined) border = mod.border
    if (mod.glow !== undefined) glow = mod.glow
    if (mod.customClass !== undefined) customClasses.push(mod.customClass)
    if (mod.glyphOverride !== undefined) glyphOverride = mod.glyphOverride
  }

  return { face, modifiers, color, tilt, scale, border, glow, glyphOverride, customClasses }
}

export function resolveCoinFaces(effects: CoinEffect[]): { H: ResolvedCoinFace; T: ResolvedCoinFace } {
  return {
    H: resolveCoinFace({ face: 'H', effects }),
    T: resolveCoinFace({ face: 'T', effects }),
  }
}
