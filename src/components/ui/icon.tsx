// Shared icon plumbing — the single source of truth for the icon prop shape
// and the `withIcon` wrapper. Every icon record in the app (face / effect /
// charm / tier / action) is built with `withIcon` and typed with `IconDef`.
//
// react-icons are fill-based (no `strokeWidth`), so each icon is wrapped with
// `withIcon` to accept the legacy prop shape (size / strokeWidth / className /
// color / aria-hidden); `strokeWidth` is accepted and ignored.

import type { ComponentType } from 'react'

/** The prop shape every icon accepts (legacy-compatible). */
export interface IconProps {
  size?: number
  /** Accepted for compatibility; ignored (react-icons are fill-based). */
  strokeWidth?: number
  className?: string
  color?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

/** The prop shape a raw react-icons icon component accepts. */
type IconComponent = ComponentType<{
  size?: number | string
  className?: string
  color?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}>

/** Wrap a react-icons icon so it accepts the legacy prop shape. */
export function withIcon(IconCmp: IconComponent): ComponentType<IconProps> {
  return function WrappedIcon(props: IconProps) {
    const { size, className, color, 'aria-hidden': ariaHidden } = props
    return <IconCmp size={size} className={className} color={color} aria-hidden={ariaHidden} />
  }
}

/** A single icon definition: the component + a11y label + optional color +
 *  optional short display name (rendered as small text under the icon). */
export interface IconDef {
  icon: ComponentType<IconProps>
  label: string
  colorToken?: string
  /** Short display name (e.g. "Weight" for "Weight (75/25)"). */
  short?: string
}

/** Per-effect, per-face-stage glyph + color (M19): one icon + color for each
 *  face stage (H / T / face-down). */
export interface EffectFaceConfig {
  H: { icon: ComponentType<IconProps>; color: string }
  T: { icon: ComponentType<IconProps>; color: string }
  facedown: { icon: ComponentType<IconProps>; color: string }
}
