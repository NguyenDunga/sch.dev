// Coin visual modifier — the output of the chain resolver.
// Each side (H/T) resolves independently.

import type { Face, CoinEffect } from '@/core/types'

/** A single visual modifier that the resolver can apply. */
export interface CoinVisualModifier {
  /** Color tint (CSS color or token reference). */
  color?: string
  /** Border style override. */
  border?: string
  /** Glow (CSS box-shadow value). */
  glow?: string
  /** Custom CSS class for special effects. */
  customClass?: string
  /** Custom data for the glyph layer (e.g. which icon to show). */
  glyphOverride?: string
}

/** The fully resolved visual state for one side of a coin. */
export interface ResolvedCoinFace {
  face: Face | undefined
  /** The combined visual modifiers (applied in priority order). */
  modifiers: CoinVisualModifier[]
  /** The resolved color (last non-undefined wins). */
  color: string
  /** The resolved border (last non-undefined wins). */
  border: string
  /** The resolved glow (last non-undefined wins). */
  glow: string
  /** The resolved glyph override (last non-undefined wins). */
  glyphOverride?: string
  /** All custom classes (accumulated). */
  customClasses: string[]
}

/** The resolver input: a face (undefined = face-down) + its effects. */
export interface ResolverInput {
  face: Face | undefined
  effects: CoinEffect[]
  /**
   * A face to pre-display on the face-down back (e.g. a Magnetic coin
   * pre-displays its left neighbour's known face). Only applies when
   * `face === undefined`; overrides the per-effect back.
   */
  predisplayFace?: Face
}

/** The resolver output: a fully resolved visual state. */
export type ResolverOutput = ResolvedCoinFace
