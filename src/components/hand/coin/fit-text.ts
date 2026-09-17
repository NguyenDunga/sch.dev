// fitTextSize — auto-fit a short text label to the chord of a circle.
//
// The label sits below a centered icon inside a circular disk (the coin face).
// Its available width is the chord of the disk at the label's vertical
// position. This estimates the text width (chars × avg uppercase em) and
// shrinks the font until it fits (10% chord margin). Floor: 4px; 0 = no room.

/** The average width of an uppercase letter in em (incl. the 0.03em
 *  letter-spacing). */
const CHAR_EM = 0.65

/** Fit `text` (at `baseSize`) to the chord of a `diskSize` circle where the
 *  label sits `iconSize` + gap below the center. Returns the font size in px
 *  (0 when there is no room). */
export function fitTextSize(text: string, diskSize: number, iconSize: number, baseSize: number): number {
  const gap = 2
  const r = diskSize / 2
  const y = (iconSize + gap) / 2 // the label center's distance from the disk center
  if (y >= r - 1) return 0
  const chord = 2 * Math.sqrt(r * r - y * y) * 0.9
  const width = text.length * CHAR_EM * baseSize
  if (width <= chord) return baseSize
  return Math.max(4, Math.round((chord / (text.length * CHAR_EM)) * 10) / 10)
}
