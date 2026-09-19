# M20 — Tutorial / First-Run Coach

**Depends:** M19 · **Files:** `src/core/tutorial.ts` (new), `src/state/tutorial.ts` (new), `src/components/tutorial/tutorial-overlay.tsx` (new), `src/components/tutorial/tutorial.css` (new), `src/pages/menu.tsx`, `src/pages/run/run-screen.tsx`, `src/pages/shop.tsx` · **Source of truth:** [SDD](../../sdd/software_design_data.md) · Conventions: [overview](plan_wbs-overview.md).

*Goal: a lightweight, non-blocking tutorial that teaches the first hand and the first shop. A spotlight overlay highlights the target control and a tooltip card explains it; the coach **auto-advances on the real game action** (not on a "next" click). Pure core logic — M14 determinism is a hard constraint (no `Math.random`, no `Date`, no RNG consumption). Tutorial state is **not** part of `RunState` (a separate store slice + its own localStorage key), so the M14.3 determinism regression is untouched.*

## Design Decisions

1. **Pure core logic.** `advanceTutorial(steps, index, action)` is a pure function in `src/core/tutorial.ts`: given the current step index and the player's action id, it returns the next step index (or `steps.length` when done). No side effects, no RNG, no `Date` — so it is trivially testable and can never break determinism.

2. **Separate store slice.** `src/state/tutorial.ts` holds `{ active, stepIndex, completed, oneShotsSeen }`. It is deliberately **not** part of `RunState` — folding it in would change the serialized run and break the M14.3 determinism regression.

3. **Persistence.** A `tutorialDone` boolean in its own localStorage key (`sch.dev.tutorial.v1`), written only by the store layer (M11 convention — the store is the only layer that touches localStorage). One-shot hints (`oneShotsSeen`) are persisted the same way so a dismissed hint never returns.

4. **UI — spotlight overlay.** A `position: fixed` overlay with a cut-out (spotlight) around the current `data-tut` anchor, plus a tooltip card with the step text. It never blocks input (`pointer-events: none` except the Skip button). `aria-live="polite"` announces steps to screen readers. **Reduced motion** (M13b convention): no spotlight animation, an instant fade.

5. **Auto-advance on real actions.** Each existing game action ends with `tutorial.advance('<action>')` (e.g. picking a coin → `advance('pick')`, buying an offer → `advance('buy')`). The coach highlights the target and advances **only** when the player performs the actual action — no "Next" button to click through.

6. **Scope — 10 steps.** Six for the first hand (draw → pick → discard → toss → score → next hand) and four for the first shop (buy → merge → reroll → leave), plus a one-shot registry for re-showable hints. The tutorial runs once (gated by `tutorialDone`); one-shots can re-trigger.

## Contract

```ts
// core/tutorial.ts
interface TutorialStep {
  id: string            // stable id (also the localStorage one-shot key)
  anchor: string        // the data-tut value to spotlight
  text: string          // the tooltip copy
  advanceOn: string     // the action id that advances past this step
}
// Pure: current index + the action just performed → next index (steps.length = done).
function advanceTutorial(steps: TutorialStep[], index: number, action: string): number

// state/tutorial.ts
interface TutorialState {
  active: boolean
  stepIndex: number
  completed: boolean
  oneShotsSeen: string[]
}
// store actions: start(), advance(action), skip(), markOneShot(id)
// persistence: localStorage 'sch.dev.tutorial.v1' → { tutorialDone, oneShotsSeen }
```

## Checkpoints

- [ ] 20.1 `src/core/tutorial.ts`: the `TutorialStep` type + the pure `advanceTutorial` (no RNG / no Date).
- [ ] 20.2 `src/state/tutorial.ts`: the tutorial store slice (`{ active, stepIndex, completed, oneShotsSeen }`) + `start`/`advance`/`skip`/`markOneShot` + localStorage persistence (`sch.dev.tutorial.v1`).
- [ ] 20.3 `src/components/tutorial/tutorial-overlay.tsx` + `.css`: the spotlight overlay (cut-out around `data-tut`), the tooltip card, the Skip button, `aria-live`.
- [ ] 20.4 Wire the first-hand steps (6): draw → pick → discard → toss → score → next hand, each advancing on its real action.
- [ ] 20.5 Wire the first-shop steps (4): buy → merge → reroll → leave, each advancing on its real action.
- [ ] 20.6 The one-shot registry: re-showable hints gated by `oneShotsSeen`.
- [ ] 20.7 Reduced-motion + a11y: no spotlight animation under `prefers-reduced-motion`; `aria-live` announcements; Esc/Skip dismiss.
- [ ] 20.8 Tests: `advanceTutorial` (pure — step transitions + done), the store slice (start/advance/skip/persist), the overlay (spotlight + skip + reduced motion).
- [ ] 20.9 Gate: `tsc` + `eslint` + `check-structure` + `vitest` + `vite build` all green; the M14.3 determinism regression still passes (tutorial state is not in `RunState`).
- [ ] 20.10 Manual playtest: a fresh profile (no localStorage) completes the first-hand + first-shop tutorial; it never blocks input; it never returns after completion.

## Exit gate

`tsc` + `eslint` + `check-structure` + `vitest` + `vite build` all green; a fresh profile sees the coach on the first hand + first shop; it auto-advances only on the real actions; Esc/Skip dismisses it; it never blocks input; reduced-motion variants work; `advanceTutorial` is pure (no `Math.random` / `Date` / RNG); the M14.3 determinism regression still passes (tutorial state is not part of `RunState`).

## Status — PLANNED (not yet implemented)

Written 2026-09-19 as the next milestone after M19. Awaiting scope confirmation before implementation.
