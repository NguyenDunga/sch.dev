// RadialReveal — a general-purpose circular hover-reveal (M19).
//
// A conic-gradient ring (one wedge per item, each with its own color) surrounds
// a disk. The disk shows the default icon by default; hovering a ring wedge
// radially wipes in that item's icon (a clip-path circle growing from the wedge
// direction). Hovering the disk collapses back to the default.
//
// The reveal plays in two beats (the "wind-up"): a TINY slow peek grows for
// ~1s (the anticipation), then the wipe lands FAST (~250ms) while the glyph
// scales up from the wedge direction (the expand) — see radial-reveal-layer.
//
// The component is library-agnostic: it renders any icon component that accepts
// { size, className, color, aria-hidden } (the IconProps shape used by
// react-icons). It carries a single role="img" + aria-label (the default label
// plus the item labels) for a11y.
//
// Structure (one file per concern):
//   radial-reveal.tsx        — this file: state, layout, a11y, composition
//   radial-reveal-ring.tsx   — the conic-gradient ring + SVG pie-slice hits
//   radial-reveal-glyph.tsx  — the icon + auto-fitted short name
//   radial-reveal-layer.tsx  — the two-beat reveal animation (clip + expand)
//   radial-reveal-geometry.ts — polar → cartesian helpers

import { useState } from 'react'
import { AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ComponentType } from 'react'
import type { IconProps } from '@/lib/icons'
import { RingHits } from './radial-reveal-ring'
import { GlyphStack } from './radial-reveal-glyph'
import { RevealLayer } from './radial-reveal-layer'
import { polarToCartesian, ringBackground } from './radial-reveal-geometry'

export interface RadialRevealItem {
  /** The wedge + icon color (a CSS color). */
  color: string
  /** The icon component (accepts IconProps). */
  icon: ComponentType<IconProps>
  /** The a11y label for this item. */
  label?: string
  /** The short display name (rendered as small text below the icon). */
  short?: string
}

export interface RadialRevealProps {
  /** One item per ring wedge. */
  items: RadialRevealItem[]
  /** The default icon (shown on the disk when no wedge is hovered). */
  defaultIcon?: ComponentType<IconProps>
  /** The default icon color. */
  defaultColor?: string
  /** The a11y label for the default state. */
  defaultLabel?: string
  /** The short display name for the default state (small text below the icon). */
  defaultShort?: string
  /** The overall diameter in px (default 120). */
  size?: number
  /** The ring width in px (default 12). */
  ringWidth?: number
  /** The icon size in px (default = size * 0.4). */
  iconSize?: number
  /** The disk background color (default var(--surface)). */
  diskColor?: string
  /** Force reduced-motion on/off (default: the OS preference via
   *  useReducedMotion — set false to preview the animation on a
   *  reduced-motion device). */
  reducedMotion?: boolean
}

export function RadialReveal({
  items,
  defaultIcon,
  defaultColor,
  defaultLabel,
  defaultShort,
  size = 120,
  ringWidth = 12,
  iconSize,
  diskColor = 'var(--surface)',
  reducedMotion,
}: RadialRevealProps) {
  const [active, setActive] = useState<number | null>(null)
  const osReduced = useReducedMotion()
  const reduced = reducedMotion ?? osReduced

  const n = items.length
  const c = size / 2
  const diskSize = Math.max(0, size - 2 * ringWidth)
  const diskOffset = ringWidth
  const icon = Math.max(0, iconSize ?? Math.round(size * 0.4))
  const gap = n > 1 ? 2 : 0

  // The directional origin for the radial wipe: the active wedge's mid-angle
  // projected onto the disk edge (as a percentage of the disk).
  const revealOrigin = (() => {
    if (active === null || diskSize <= 0) return '50% 50%'
    const mid = active * (360 / n) + 180 / n
    const p = polarToCartesian(c, c, diskSize / 2, mid)
    // Convert to the disk's local coords (the disk starts at diskOffset).
    const x = ((p.x - diskOffset) / diskSize) * 100
    const y = ((p.y - diskOffset) / diskSize) * 100
    return `${x.toFixed(1)}% ${y.toFixed(1)}%`
  })()

  const itemLabels = items.map((i) => i.label).filter(Boolean).join(', ')
  const ariaLabel = [defaultLabel, itemLabels || undefined].filter(Boolean).join(' — ') || 'reveal'

  const DefaultIcon = defaultIcon
  const ActiveIcon = active !== null ? items[active].icon : null

  return (
    <div
      className="radial-reveal"
      role="img"
      aria-label={ariaLabel}
      style={{ width: size, height: size, position: 'relative' }}
      onMouseLeave={() => setActive(null)}
    >
      {/* The conic-gradient ring (one wedge per item, per-wedge color). */}
      <div
        className="radial-reveal-ring"
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: ringBackground(items, gap),
          WebkitMaskImage: 'radial-gradient(farthest-side, transparent calc(100% - var(--rr-ring-width)), #000 calc(100% - var(--rr-ring-width) + 1px))',
          maskImage: 'radial-gradient(farthest-side, transparent calc(100% - var(--rr-ring-width)), #000 calc(100% - var(--rr-ring-width) + 1px))',
          ['--rr-ring-width' as string]: `${ringWidth}px`,
        }}
      />

      {/* The SVG ring hit areas (one pie-slice per item). */}
      <RingHits items={items} size={size} ringWidth={ringWidth} gap={gap} onEnter={setActive} />

      {/* The disk (the default icon + the reveal layer). */}
      <div
        className="radial-reveal-disk"
        style={{
          position: 'absolute',
          left: diskOffset,
          top: diskOffset,
          width: diskSize,
          height: diskSize,
          borderRadius: '50%',
          background: diskColor,
          overflow: 'hidden',
        }}
        onMouseEnter={() => setActive(null)}
      >
        {/* The default icon + short name (always visible, when provided). */}
        {DefaultIcon && (
          <div className="radial-reveal-default" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <GlyphStack icon={DefaultIcon} color={defaultColor} text={defaultShort} iconSize={icon} diskSize={diskSize} />
          </div>
        )}

        {/* The reveal layer (the hovered item's icon, radially wiped in):
            a tiny slow peek (the anticipation), then the fast wipe. */}
        <AnimatePresence>
          {active !== null && ActiveIcon && (
            <RevealLayer
              key={active}
              icon={ActiveIcon}
              color={items[active].color}
              text={items[active].short}
              iconSize={icon}
              diskSize={diskSize}
              origin={revealOrigin}
              reduced={!!reduced}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
