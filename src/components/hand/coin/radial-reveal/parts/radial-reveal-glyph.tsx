// The RadialReveal glyph stack (M19): the icon + auto-fitted short name
// (the text sits below the icon, hidden when it doesn't fit the chord).

import type { ComponentType } from 'react'
import type { IconProps } from '@/components/ui/icon'
import { fitTextSize } from '../../visual/fit-text'

export function GlyphStack({
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
