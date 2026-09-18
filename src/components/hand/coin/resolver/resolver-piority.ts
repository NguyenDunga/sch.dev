import type { CoinEffect } from '@/core/types'
import type { Face } from '@/core/types'
import type { CoinVisualModifier } from '../coin-types'
import { FACEDOWN_HEAD_BACK, FACEDOWN_TAIL_BACK } from '../visual/facedown-backs'
import { WEIGHT_META, resolveWeight } from '../effect-weight/weight-config'
import { HEADS_META, resolveHeads } from '../effect-heads/heads-config'
import { TAILS_META, resolveTails } from '../effect-tails/tails-config'
import { CHAOS_META, CHAOS_VALUES, resolveChaos } from '../effect-chaos/chaos-config'
import { ECHO_META, ECHO_VALUES, resolveEcho } from '../effect-echo/echo-config'
import { MAGNETIC_META, MAGNETIC_VALUES, resolveMagnetic } from '../effect-magnetic/magnetic-config'
import { REVERSE_META, REVERSE_VALUES, resolveReverse } from '../effect-reverse/reverse-config'
import { TAX_META, TAX_VALUES, resolveTax } from '../effect-tax/tax-config'
import { JACKPOT_META, JACKPOT_VALUES, resolveJackpot } from '../effect-jackpot/jackpot-config'
import { DRAW_META, DRAW_FACEDOWN_BACK, resolveDraw } from '../effect-draw/draw-config'


// ── Priority map (from each effect's config) ─────────────────────────────────

export const PRIORITY: Record<CoinEffect['kind'], number> = {
  weight: WEIGHT_META.priority,
  heads: HEADS_META.priority,
  tails: TAILS_META.priority,
  chaos: CHAOS_META.priority,
  echo: ECHO_META.priority,
  magnetic: MAGNETIC_META.priority,
  reverse: REVERSE_META.priority,
  tax: TAX_META.priority,
  jackpot: JACKPOT_META.priority,
  draw: DRAW_META.priority,
}

// ── Dispatch to the per-effect resolver ──────────────────────────────────────

export function effectToModifier(effect: CoinEffect, face: Face | undefined): CoinVisualModifier {
  switch (effect.kind) {
    case 'weight': return resolveWeight(effect, face)
    case 'heads': return resolveHeads(face)
    case 'tails': return resolveTails(face)
    case 'chaos': return resolveChaos()
    case 'echo': return resolveEcho()
    case 'magnetic': return resolveMagnetic()
    case 'reverse': return resolveReverse()
    case 'tax': return resolveTax()
    case 'jackpot': return resolveJackpot()
    case 'draw': return resolveDraw(effect)
  }
}

// ── Face-down back (one per effect) ──────────────────────────────────────────
//
// Face-down is a *state* (the face is hidden in hand), not an effect. Each
// effect's coin has its own back look; a plain coin (no effects) falls back to
// the generic sunk back in the resolver.

export function facedownBackFor(effect: CoinEffect): CoinVisualModifier {
  switch (effect.kind) {
    // Known-face effects pre-display their face (Weight by favoured face;
    // Heads/Tails are guaranteed).
    case 'weight': return effect.favored === 'H' ? FACEDOWN_HEAD_BACK : FACEDOWN_TAIL_BACK
    case 'heads': return FACEDOWN_HEAD_BACK
    case 'tails': return FACEDOWN_TAIL_BACK
    case 'chaos': return CHAOS_VALUES.facedown
    case 'echo': return ECHO_VALUES.facedown
    case 'magnetic': return MAGNETIC_VALUES.facedown
    case 'reverse': return REVERSE_VALUES.facedown
    case 'tax': return TAX_VALUES.facedown
    case 'jackpot': return JACKPOT_VALUES.facedown
    case 'draw': return DRAW_FACEDOWN_BACK
  }
}
