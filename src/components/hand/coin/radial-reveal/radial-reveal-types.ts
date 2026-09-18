// RadialReveal (M19) — the props + item types.

import type { ComponentType } from 'react'
import type { IconProps } from '@/components/ui/icon'

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
