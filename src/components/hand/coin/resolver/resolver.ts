// Coin face resolver — delegates to per-effect resolvers in effects/.
//
// Each effect has its own sub-directory with config + resolver + test.
// The main resolver sorts effects by priority and applies them in order.
//
// Pure function: same input → same output. No side effects.

import type { CoinEffect, Face } from '@/core/types'
import type { CoinVisualModifier, ResolvedCoinFace, ResolverInput } from '../coin-types'
import { FACEDOWN_HEAD_BACK, FACEDOWN_TAIL_BACK } from '../facedown-backs'
import { effectToModifier, facedownBackFor, PRIORITY } from './resolver-piority'

// ── Base face colors ─────────────────────────────────────────────────────────

function baseColor(face: Face | undefined): string {
  if (face === 'H') return 'var(--heads)'
  if (face === 'T') return 'var(--tails)'
  return 'var(--surface-sunk)' // face-down
}

// ── The chain resolver ───────────────────────────────────────────────────────

export function resolveCoinFace(input: ResolverInput): ResolvedCoinFace {
  const { face, effects, predisplayFace } = input

  // Face-down: the back is per-effect (the top-priority effect's back), or the
  // generic sunk back for a plain coin. The face is hidden while face-down, so
  // no face-up modifiers apply. A `predisplayFace` (e.g. a Magnetic coin
  // pre-displaying its left neighbour's known face) overrides the per-effect back.
  if (face === undefined) {
    if (predisplayFace) {
      const back = predisplayFace === 'H' ? FACEDOWN_HEAD_BACK : FACEDOWN_TAIL_BACK
      return {
        face,
        modifiers: [],
        color: back.color ?? '',
        border: back.border ?? '',
        glow: back.glow ?? '',
        glyphOverride: undefined,
        customClasses: [],
      }
    }
    const top = highestPriorityEffect(effects)
    const back = top ? facedownBackFor(top) : {}
    return {
      face,
      modifiers: [],
      color: back.color ?? 'var(--surface-sunk)',
      border: back.border ?? '',
      glow: back.glow ?? '',
      glyphOverride: undefined,
      customClasses: back.customClass ? [back.customClass] : [],
    }
  }

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
