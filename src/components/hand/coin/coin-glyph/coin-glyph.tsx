// CoinGlyph — the main glyph on the coin (M19: RadialReveal).
//
// Three shapes, by effect count:
//   - 0 effects → the face-state icon (H / T / face-down), centered, no text
//                 (a plain face is its own archetype).
//   - 1 effect  → that effect's per-face-stage glyph, centered (no ring —
//                 the ring exists to reveal the OTHER effects).
//   - 2+ effects → a RadialReveal: a conic-gradient ring around a disk that
//                 shows the highest-priority effect by default and radially
//                 wipes in the hovered effect. The ring has one wedge per
//                 NON-top effect (the top effect is already the disk default,
//                 so it gets no wedge).
//
// The 0/1-effect glyph sits on a light disk (like the RadialReveal's disk):
// the H / T face fills are solid color, so a same-tone icon drawn directly on
// them would be invisible.
//
// Each effect carries its own per-face-stage glyph + color (EFFECT_FACE_CONFIGS).
// The coin's face stage (H / T / face-down) selects which glyph + color each
// effect shows; the ring is tinted by the face stage.
//
// `size` is the glyph diameter in px (the coin passes the face-fill size so
// the ring sits inside the shell).

import type { CoinEffect, Face } from '@/core/types'
import { FACE_ICONS, FACE_DOWN_ICON } from './icons/face-icons'
import { EFFECT_FACE_CONFIGS, EFFECT_ICONS, WEIGHT_FACEDOWN } from './icons/effect-icons'
import { RadialReveal, type RadialRevealItem } from '../radial-reveal'
import { highestPriorityEffect } from '../resolver/resolver'
import { priorityStrength, priorityTint } from './priority-tint'
import { faceStage, STAGE_COLORS, STAGE_LABELS, type FaceStage } from './stage-constant'
import { SoloGlyph } from './solo-glyph'



/** Resolve the glyph config (icon + color) for an effect at a face stage.
 *  Special case: Weight's face-down glyph depends on its favoured face. */
function glyphFor(effect: CoinEffect, stage: FaceStage) {
  if (effect.kind === 'weight' && stage === 'facedown') {
    return WEIGHT_FACEDOWN[effect.favored]
  }
  return EFFECT_FACE_CONFIGS[effect.kind][stage]
}

interface CoinGlyphProps {
  face?: Face
  effects: CoinEffect[]
  /** The glyph diameter in px (default 42 = the 56px coin's face fill). */
  size?: number
}

export function CoinGlyph({ face, effects, size = 42 }: CoinGlyphProps) {
  const stage = faceStage(face)
  const top = highestPriorityEffect(effects)

  // No effects: the face-state icon (H / T / face-down) — no text (a plain
  // face is its own archetype).
  if (!top) {
    const cfg =
      face === 'H'
        ? { icon: FACE_ICONS.H.icon, color: STAGE_COLORS.H }
        : face === 'T'
          ? { icon: FACE_ICONS.T.icon, color: STAGE_COLORS.T }
          : { icon: FACE_DOWN_ICON.icon, color: STAGE_COLORS.facedown }
    return <SoloGlyph icon={cfg.icon} color={cfg.color} label={STAGE_LABELS[stage]} size={size} />
  }

  // One effect: its per-face-stage glyph + short name directly (no ring needed).
  if (effects.length === 1) {
    const cfg = glyphFor(top, stage)
    return (
      <SoloGlyph
        icon={cfg.icon}
        color={cfg.color}
        label={`${STAGE_LABELS[stage]}, ${EFFECT_ICONS[top.kind].label}`}
        text={EFFECT_ICONS[top.kind].short}
        size={size}
      />
    )
  }

  // 2+ effects: the disk shows the top effect; the ring wedges are the OTHER
  // effects (the top one is already the disk default, so it gets no wedge).
  // Each wedge's color is tinted by the effect's priority rank among the
  // coin's active effects: low priority → lighter, high priority → darker.
  const topCfg = glyphFor(top, stage)
  const tint = (e: CoinEffect, base: string): string =>
    priorityTint(base, priorityStrength(effects, e))
  const items: RadialRevealItem[] = effects
    .filter((e) => e !== top)
    .map((e) => {
      const cfg = glyphFor(e, stage)
      return { color: tint(e, cfg.color), icon: cfg.icon, label: EFFECT_ICONS[e.kind].label, short: EFFECT_ICONS[e.kind].short }
    })

  // Keep the ring + icon positive even for tiny coins (the debug page tests
  // 24px coins → a 10px glyph): the ring is at most half the glyph minus 1px.
  const ringWidth = Math.max(2, Math.min(Math.round(size * 0.14), Math.floor(size / 2) - 1))
  const iconSize = Math.max(2, Math.round((size - 2 * ringWidth) * 0.62))

  return (
    <RadialReveal
      items={items}
      defaultIcon={topCfg.icon}
      defaultColor={topCfg.color}
      defaultLabel={`${STAGE_LABELS[stage]}, ${EFFECT_ICONS[top.kind].label}`}
      defaultShort={EFFECT_ICONS[top.kind].short}
      size={size}
      ringWidth={ringWidth}
      iconSize={iconSize}
    />
  )
}
