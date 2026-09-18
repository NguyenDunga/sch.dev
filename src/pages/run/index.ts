// C6 — Run screen (the full hand flow: draw → play → toss → buff → score).
//
// The screen is split across this module (150-LOC file rule):
//   run-screen.tsx        — the screen composition + top bar + action bar
//   hand-row.tsx          — the face-down hand row
//   play-area.tsx         — the play row + piles
//   play-area-host.tsx    — the play area wrapped in the dnd context
//   run-portals.tsx       — the portaled fixed layers (ghosts + choreo)
//   use-hand-flow.ts      — pick / 6th-pick shake / confirm / drag-drop
//   use-discard-flow.ts   — the discard paths (drag-to-well + D key)
//   use-toss-landing.ts   — the toss landing glue (projection + sfx + auto-score)
//   use-run-hooks.ts      — deals / auto-draw / phase flags / unpick / bg-clear
//   use-scoring.ts        — the scoring choreography wiring
//   use-hand-shortcuts.ts — the keyboard shortcut set
//
// UI is a thin layer — it reads RunState and calls store actions; juice
// never mutates state (UX §0).

export { RunScreen } from './run-screen'
