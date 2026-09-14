// Placeholder — flat-shaded 3D coin (react-three-fiber + drei + rapier).
// SDD UX §4 · WBS M12.5 / M13.2.
// A lazy-loaded r3f <Canvas> over the toss area: unlit / ambient-only (no
// realistic shadow), instanced coin mesh, rapier tumble. The flip ALWAYS
// settles on the engine-resolved Slot.face — physics is decorative and never
// decides the outcome. 2D cross-fade fallback under prefers-reduced-motion.
export function Coin3D() {
  // TODO: <Canvas frameloop="demand">, instanced cylinder coin, rapier toss → settle on face.
  return null
}
