// Coin face resolver — a custom handwritten chain resolver with priority modifiers.
//
// Each effect contributes a visual modifier. The resolver applies them in
// priority order (higher priority = applied later = wins on conflicts).
//
// Priority (low → high):
//   1. Base face (H/T color)
//   2. Weight (tilt toward favored side)
//   3. Double-Side (lock tilt, brighten)
//   4. Chaos (randomize border)
//   5. Echo (glow pulse)
//   6. Magnetic (border style)
//   7. Reverse (invert tilt)
//   8. Tax (dim, red tint)
//   9. Jackpot (gold glow, scale up)
//   10. Draw (tier color border)
//
// Each side (H/T) resolves independently. The resolver is pure — no side
// effects, no randomness (chaos uses a deterministic hash of the effect list).

import type { CoinEffect, CoinEffectKind, Face } from '@/core/types'
import type { CoinVisualModifier, ResolvedCoinFace, ResolverInput } from './coin-types'

// ── Base face colors ─────────────────────────────────────────────────────────

const BASE_COLORS: Record<Face, string> = {
  H: 'var(--heads)',
  T: 'var(--tails)',
}

// ── Effect → modifier mapping ────────────────────────────────────────────────

/** The priority of each effect kind (higher = applied later). */
const PRIORITY: Record<CoinEffectKind, number> = {
  weight: 2,
  doubleSide: 3,
  chaos: 4,
  echo: 5,
  magnetic: 6,
  reverse: 7,
  tax: 8,
  jackpot: 9,
  draw: 10,
}

/** Resolve a single effect into its visual modifier. */
function effectToModifier(effect: CoinEffect, face: Face): CoinVisualModifier {
  const { kind } = effect

  switch (kind) {
    case 'weight': return weightMod(effect, face)
    case 'doubleSide': return doubleSideMod(effect, face)
    case 'chaos': return chaosMod()
    case 'echo': return echoMod()
    case 'magnetic': return magneticMod()
    case 'reverse': return reverseMod()
    case 'tax': return taxMod()
    case 'jackpot': return jackpotMod()
    case 'draw': return drawMod(effect)
  }
}

function weightMod(effect: Extract<CoinEffect, { kind: 'weight' }>, face: Face): CoinVisualModifier {
  const direction = effect.favored === 'H' ? 1 : -1
  if (face === effect.favored) {
    return { tilt: direction * 12, color: 'color-mix(in srgb, var(--heads) 30%, var(--surface))' }
  }
  return { tilt: direction * -4 }
}

function doubleSideMod(effect: Extract<CoinEffect, { kind: 'doubleSide' }>, face: Face): CoinVisualModifier {
  if (face === effect.favored) {
    return {
      tilt: (effect.favored === 'H' ? 1 : -1) * 18,
      color: 'var(--heads)',
      glow: '0 0 8px 2px color-mix(in srgb, var(--heads) 40%, transparent)',
    }
  }
  return { tilt: 0, scale: 0.95 }
}

function chaosMod(): CoinVisualModifier {
  return { border: '3px dashed var(--ink-soft)', customClass: 'coin-face--chaos' }
}

function echoMod(): CoinVisualModifier {
  return {
    glow: '0 0 12px 4px color-mix(in srgb, var(--secondary) 50%, transparent)',
    customClass: 'coin-face--echo',
  }
}

function magneticMod(): CoinVisualModifier {
  return { border: '3px solid var(--ink)', scale: 1.05 }
}

function reverseMod(): CoinVisualModifier {
  return { tilt: -8, customClass: 'coin-face--reverse' }
}

function taxMod(): CoinVisualModifier {
  return {
    color: 'color-mix(in srgb, var(--danger) 25%, var(--surface))',
    scale: 0.9,
    customClass: 'coin-face--tax',
  }
}

function jackpotMod(): CoinVisualModifier {
  return {
    color: 'color-mix(in srgb, var(--tier-jackpot) 40%, var(--surface))',
    glow: '0 0 16px 6px color-mix(in srgb, var(--tier-jackpot) 50%, transparent)',
    scale: 1.1,
    border: '3px solid var(--tier-jackpot)',
    customClass: 'coin-face--jackpot',
  }
}

function drawMod(effect: CoinEffect): CoinVisualModifier {
  if (effect.kind !== 'draw') return {}
  const countColors: Record<string, string> = {
    '1': 'var(--tier-three-same)',
    '2': 'var(--tier-triple-run)',
    '3': 'var(--tier-jackpot)',
  }
  const c = String(effect.count)
  const tierColor = countColors[c] ?? 'var(--ink-soft)'
  return {
    border: `2px solid ${tierColor}`,
    customClass: `coin-face--draw-${effect.count}`,
  }
}

// ── The chain resolver ───────────────────────────────────────────────────────

/**
 * Resolve a coin face's visual state from its effects.
 *
 * Pure function: same input → same output. No side effects, no randomness.
 * Effects are sorted by priority (low → high) and applied in order.
 * Later modifiers override earlier ones for the same property.
 */
export function resolveCoinFace(input: ResolverInput): ResolvedCoinFace {
  const { face, effects } = input

  // Start with the base face
  let color = BASE_COLORS[face]
  let tilt = 0
  let scale = 1
  let border = ''
  let glow = ''
  let glyphOverride: string | undefined
  const customClasses: string[] = []
  const modifiers: CoinVisualModifier[] = []

  // Sort effects by priority (low → high, applied in order)
  const sorted = [...effects].sort((a, b) => PRIORITY[a.kind] - PRIORITY[b.kind])

  // Apply each effect's modifier in priority order
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

  return {
    face,
    modifiers,
    color,
    tilt,
    scale,
    border,
    glow,
    glyphOverride,
    customClasses,
  }
}

/**
 * Resolve both sides of a coin.
 * Returns the resolved state for each face (H and T).
 */
export function resolveCoinFaces(effects: CoinEffect[]): { H: ResolvedCoinFace; T: ResolvedCoinFace } {
  return {
    H: resolveCoinFace({ face: 'H', effects }),
    T: resolveCoinFace({ face: 'T', effects }),
  }
}
