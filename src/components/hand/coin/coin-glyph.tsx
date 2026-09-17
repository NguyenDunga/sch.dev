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

import type { ComponentType } from 'react'
import type { CoinEffect, Face } from '@/core/types'
import type { IconProps } from '@/lib/icons'
import { EFFECT_FACE_CONFIGS, EFFECT_ICONS, FACE_ICONS, FACE_DOWN_ICON } from '@/lib/icons'
import { RadialReveal, type RadialRevealItem } from './radial-reveal'
import { fitTextSize } from './fit-text'
import { highestPriorityEffect } from './coin-resolver'

type FaceStage = 'H' | 'T' | 'facedown'

/** The coin's face stage (face-down when `face` is undefined). */
function faceStage(face: Face | undefined): FaceStage {
  return face === undefined ? 'facedown' : face
}

/** The face-stage base color (used for the default icon of a plain coin). */
const STAGE_COLORS: Record<FaceStage, string> = {
  H: 'var(--heads)',
  T: 'var(--tails)',
  facedown: 'var(--ink-soft)',
}

/** The face-stage a11y label. */
const STAGE_LABELS: Record<FaceStage, string> = {
  H: 'Heads',
  T: 'Tails',
  facedown: 'face-down',
}

/** The direct (no-ring) glyph: a single centered icon + short name on a light
 *  disk (the disk guarantees contrast on the solid H / T face fills). The text
 *  is auto-fitted to the disk chord. */
function SoloGlyph({ icon, color, label, text, size }: { icon: ComponentType<IconProps>; color: string; label: string; text?: string; size: number }) {
  const GlyphIcon = icon
  const iconSize = Math.max(2, Math.round(size * 0.62))
  const baseSize = Math.max(5, Math.round(size * 0.16))
  const fontSize = text && size >= 24 ? fitTextSize(text, size, iconSize, baseSize) : 0
  return (
    <div
      className="coin-glyph-solo"
      role="img"
      aria-label={label}
      style={{ width: size, height: size, display: 'grid', placeItems: 'center' }}
    >
      <div
        className="coin-glyph-solo-disk"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
      >
        <GlyphIcon size={iconSize} color={color} aria-hidden />
        {fontSize > 0 && (
          <span
            className="coin-glyph-solo-text"
            style={{ fontSize, fontWeight: 600, lineHeight: 1, color, textTransform: 'uppercase', letterSpacing: '0.03em' }}
          >
            {text}
          </span>
        )}
      </div>
    </div>
  )
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
    const cfg = EFFECT_FACE_CONFIGS[top.kind][stage]
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
  const topCfg = EFFECT_FACE_CONFIGS[top.kind][stage]
  const items: RadialRevealItem[] = effects
    .filter((e) => e !== top)
    .map((e) => {
      const cfg = EFFECT_FACE_CONFIGS[e.kind][stage]
      return { color: cfg.color, icon: cfg.icon, label: EFFECT_ICONS[e.kind].label, short: EFFECT_ICONS[e.kind].short }
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
