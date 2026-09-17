// RadialReveal — a general-purpose circular hover-reveal (M19).
//
// A conic-gradient ring (one wedge per item, each with its own color) surrounds
// a disk. The disk shows the default icon by default; hovering a ring wedge
// radially wipes in that item's icon (a clip-path circle growing from the wedge
// direction). Hovering the disk collapses back to the default.
//
// The component is library-agnostic: it renders any icon component that accepts
// { size, className, color, aria-hidden } (the IconProps shape used by
// react-icons). It carries a single role="img" + aria-label (the default label
// plus the item labels) for a11y.
//
// The wipe uses framer-motion's clipPath animation (0% → 75%) with a directional
// origin (the wedge mid-angle projected onto the disk edge). Reduced motion →
// duration 0 (instant).

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import type { ComponentType } from 'react'
import type { IconProps } from '@/lib/icons'
import { fitTextSize } from './fit-text'

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
}

/** Convert polar (r, angleDeg) to cartesian (x, y) around a center. */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** The SVG ring hit areas (one pie-slice per item). */
function RingHits({
  items,
  size,
  ringWidth,
  gap,
  onEnter,
}: {
  items: RadialRevealItem[]
  size: number
  ringWidth: number
  gap: number
  onEnter: (i: number) => void
}) {
  const n = items.length
  const c = size / 2
  const rOuter = c
  const rInner = Math.max(0, c - ringWidth)
  return (
    <svg
      className="radial-reveal-hits"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      {items.map((item, i) => {
        const start = i * (360 / n) + gap
        const end = (i + 1) * (360 / n) - gap
        const p1 = polarToCartesian(c, c, rOuter, start)
        const p2 = polarToCartesian(c, c, rOuter, end)
        const p3 = polarToCartesian(c, c, rInner, end)
        const p4 = polarToCartesian(c, c, rInner, start)
        const large = end - start > 180 ? 1 : 0
        const d = `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y} Z`
        return (
          <path
            key={i}
            d={d}
            fill="transparent"
            style={{ pointerEvents: 'all', cursor: 'pointer' }}
            onMouseEnter={() => onEnter(i)}
            aria-label={item.label}
          />
        )
      })}
    </svg>
  )
}

/** The conic-gradient ring background (one color stop pair per item). */
function ringBackground(items: RadialRevealItem[], gap: number): string {
  if (items.length === 0) return 'transparent'
  const n = items.length
  return `conic-gradient(${items
    .map((item, i) => {
      const start = i * (360 / n) + gap
      const end = (i + 1) * (360 / n) - gap
      return `${item.color} ${start}deg ${end}deg`
    })
    .join(', ')})`
}

/** The icon + short-name column (the text sits below the icon). The text is
 *  auto-fitted to the disk chord (hidden when it doesn't fit). */
function GlyphStack({
  icon: GlyphIcon,
  color,
  text,
  iconSize,
  diskSize,
}: {
  icon: ComponentType<IconProps>
  color?: string
  text?: string
  iconSize: number
  diskSize: number
}) {
  const baseSize = Math.max(5, Math.round(diskSize * 0.16))
  const fontSize = text && diskSize >= 20 ? fitTextSize(text, diskSize, iconSize, baseSize) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <GlyphIcon size={iconSize} color={color} aria-hidden />
      {fontSize > 0 && (
        <span
          className="radial-reveal-text"
          style={{ fontSize, fontWeight: 600, lineHeight: 1, color, textTransform: 'uppercase', letterSpacing: '0.03em' }}
        >
          {text}
        </span>
      )}
    </div>
  )
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
}: RadialRevealProps) {
  const [active, setActive] = useState<number | null>(null)
  const reduced = useReducedMotion()

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

        {/* The reveal layer (the hovered item's icon, radially wiped in). */}
        <AnimatePresence>
          {active !== null && ActiveIcon && (
            <motion.div
              key={active}
              className="radial-reveal-reveal"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                clipPath: `circle(85% at ${revealOrigin})`,
                backgroundColor: `var(--line)`
              }}
              initial={{ clipPath: `circle(0% at ${revealOrigin})` }}
              animate={{ clipPath: `circle(90% at ${revealOrigin})` }}
              exit={{ clipPath: `circle(0% at ${revealOrigin})` }}
              transition={{ duration: reduced ? 0 : 0.25, ease: 'easeOut' }}
            >
              <GlyphStack icon={ActiveIcon} color={items[active].color} text={items[active].short} iconSize={icon} diskSize={diskSize} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
