
import type { ComponentType } from 'react'
import type { IconProps } from '@/lib/icons'
import { fitTextSize } from '../fit-text'



/** The direct (no-ring) glyph: a single centered icon + short name on a light
 *  disk (the disk guarantees contrast on the solid H / T face fills). The text
 *  is auto-fitted to the disk chord. */
export function SoloGlyph({ icon, color, label, text, size }: { icon: ComponentType<IconProps>; color: string; label: string; text?: string; size: number }) {
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