// Coin face icons — the face-state glyphs (heads / tails / face-down), the
// single source of truth for how a coin's face is drawn. Built on
// `react-icons` (Font Awesome 6 = `fa6`).

import { FaCircle, FaCircleDot } from 'react-icons/fa6'
import type { Face } from '@/core/types'
import { withIcon, type IconDef } from '@/components/ui/icon'

export const FACE_ICONS: Record<Face, IconDef> = {
  H: { icon: withIcon(FaCircle), label: 'Heads', colorToken: 'var(--heads)' },
  T: { icon: withIcon(FaCircleDot), label: 'Tails', colorToken: 'var(--tails)' },
}

/** The face-down (back) coin icon: a plain solid circle (no glyph — the face is
 *  hidden). */
export const FACE_DOWN_ICON: IconDef = { icon: withIcon(FaCircle), label: 'Face down' }
