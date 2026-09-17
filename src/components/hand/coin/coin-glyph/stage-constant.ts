import type { Face } from "@/core/types"

export type FaceStage = 'H' | 'T' | 'facedown'

/** The coin's face stage (face-down when `face` is undefined). */
export function faceStage(face: Face | undefined): FaceStage {
  return face === undefined ? 'facedown' : face
}

/** The face-stage base color (used for the default icon of a plain coin). */
export const STAGE_COLORS: Record<FaceStage, string> = {
  H: 'var(--heads)',
  T: 'var(--tails)',
  facedown: 'var(--ink-soft)',
}

/** The face-stage a11y label. */
export const STAGE_LABELS: Record<FaceStage, string> = {
  H: 'Heads',
  T: 'Tails',
  facedown: 'face-down',
}