# M13b — Animation System Migration to Motion (Framer Motion)

**Depends:** M13 (Juice — the animations exist and are green), M13a (interaction overhaul — drag/drop, projected score, auto-advance) · **Files:** `src/lib/motion.ts`, `src/components/hand/{hand-coin,toss-coin,play-slot,score-ticker}.tsx`, `src/components/hand/toss.ts`, `src/components/juice/{choreography.ts,use-scoring-choreography.ts,scoring-choreography.tsx,screen-shake.ts,screen-shake.tsx,particles.ts,particles.tsx}`, `src/components/run/{discard-ghost.tsx,deal.ts}`, `src/components/ui/button/{buttonPhysics.tsx,buttonVariants.tsx}`, `src/pages/run.tsx`, and the CSS carrying animation (`src/components/hand/{coin.css,toss-coin.css}`, `src/components/juice/choreo.css`, `src/components/run/run.css`, `src/index.css`) · **Source of truth:** [SDD UX](../../sdd/software_design_ux.md) §0 (juice boundary), §2 (motion tokens), §4–§5 (timing table), §6 (scoring choreography), §7 (particles & shake), §8 (reduced motion), §9 (perf); [Component Design](../../sdd/software_design_component.md) C10; the [M13 Juice plan](plan_wbs-m13-juice.md). Conventions: [overview](plan_wbs-overview.md).

*Goal: consolidate the animation layer onto a single library — **Motion** (the current name of Framer Motion) — so the library owns timing, sequencing and springs instead of the hand-rolled `setTimeout` chains, module-level `requestAnimationFrame` loops, CSS `@keyframes`, and direct `style.transform` writes that grew up alongside M13. Today the system is a **mix**: `hand-coin`, `play-slot`, `toss-coin`, `score-ticker`, `scoring-choreography` and `discard-ghost` already use `motion`/`useAnimation`/`animate`/motion values, while the choreography beats, screen shake, coin micro-motions, and the run-screen timing glue are still bespoke. This milestone finishes the job: one motion model, one set of tokens, timing that can't drift from the animation that produces it.*

**Boundary (UX §0 — unchanged):** the migration is **presentation-only and behavior-preserving**. Juice reads `lastScore`/`RunState`, never mutates state, never gates an action, and stays **skippable** (a skip snaps to the settled end and changes no number — 13.4). The 3D coin still always lands on the engine's `Slot.face`. This is a **refactor**: the same beats, the same durations (the `lib/motion.ts` tokens and `beatDurations` math are the source of truth — port them, don't retune), the same landing faces, and the same public component props where practical. No `src/core/` or `src/state/` file is touched; the engine and store test suites stay 100% green and are not edited. `Math.random()` stays banned in `core`/`state` — the presentational randomness in shake/particles is unaffected. Retuning of curves, if any is wanted, is a **separate** follow-up (M13c), not this migration.

## Current state (audit — what is and isn't on Motion)

**Already on Motion (leave the behavior, modernize the API where noted):**
- `hand-coin.tsx` — `motion.button` with shared `layoutId`/`layout` pick↔unpick, the deal-flight via `initial`/`animate`, `useReducedMotion`. *But* the hover tilt is written straight to the DOM (`style.transform` on every `pointermove`) and the 6th-pick shake is a **CSS `@keyframes coin-shake`** restarted by a `key` remount.
- `play-slot.tsx` — `motion.button` + shared `layoutId`.
- `toss-coin.tsx` — uses the **legacy `useAnimation()` controls** driven by an `async` chain with a `sleep()` (`setTimeout`) stagger.
- `score-ticker.tsx` — idiomatic `animate()` + `useMotionValue` + `useTransform` count-ups.
- `scoring-choreography.tsx` — per-element `motion.span` animations gated on the current beat.
- `discard-ghost.tsx` — `motion.div` flight with `onAnimationComplete`.

**Still bespoke (the migration targets):**
- `use-scoring-choreography.ts` — the 7-beat sequence is a **manual `setTimeout` chain** (`scheduleBeats`); the visual pieces are Motion but the *timeline* is hand-rolled.
- `screen-shake.ts` — a **module-level singleton + `requestAnimationFrame` loop** writing `style.transform`, with `attachShakeEl` DOM plumbing.
- CSS `@keyframes` — `coin-shake` (`coin.css`), `onboarding-in` (`run.css`).
- `hand-coin.tsx` pointer tilt — direct `style.transform` writes.
- `buttonPhysics.tsx` — Tailwind CSS transitions (`transition-[...]`, `hover:`/`active:`).
- `run.tsx` timing glue — `useTossSfx`, the `useAutoScore` delay math, and `useTossProjection` landing timers all re-derive `TOSS.stagger`/`TOSS.rise` in `setTimeout`, in parallel with the toss animation they must stay in step with.
- `particles.ts` — a **custom canvas particle/confetti engine** with its own rAF loop. **Deliberately kept** (see 13b.9): Motion is not a particle engine.

## Checkpoints

### Foundation

- [x] **13b.1 Install the Motion library (previously Framer Motion).** `npm i framer-motion` (installed at `framer-motion@^13.2.0`). Resolve the version and ensure a clean `npm run build`. *Accept:* the dependency is present and `tsc -b && vite build` is green. **Done.**

- [x] **13b.2 One motion config, one token set.** `MotionConfig reducedMotion="user"` at the app root (13b.1). `src/lib/motion.ts` is the only home for springs/easings/durations — added `CHOREO` (per-beat pop durations) and `SHAKE_DURATION`/`CLEAR_SHAKE_DURATION` (shake ms). All inline curves/durations consolidated into the tokens. Standardized on `framer-motion` (not `motion/react`). *Accept:* one `MotionConfig` at the run root; no bezier tuple or ms literal for a motion curve lives outside `lib/motion.ts`; a single import path across the animation files; `tsc --noEmit`, `npm run lint`, `npm test` green. **Done.**

### Timeline consolidation

- [x] **13b.3 Toss: legacy `useAnimation` + `sleep()` → a Motion timeline.** Replaced `toss-coin.tsx`'s imperative `controls` + `async`/`sleep` stagger with `useAnimate` + keyframes: the rise (ease-out) and the parallel tumble (timed to land with the coin), the spring-bouncy settle chained off the rise's `finished` marker, and the left→right stagger via `delay`. The landing sparkle (`emitBurst`) and land `sfx` fire from the rise's `finished` marker (not a `setTimeout`). The `onLand` callback (with the coin's slot index) is a stable prop — it never re-triggers the toss animation. The reduced-motion 2D cross-fade path is kept. *Accept:* no `setTimeout`/`sleep` in `toss-coin.tsx`; the coin still lands on `Slot.face`; `toss-coin.test.tsx` green. **Done.**

- [x] **13b.4 Scoring choreography: `setTimeout` beat scheduler → a Motion timeline.** Replaced `scheduleBeats`/`useScoringChoreography`'s `setTimeout` chain with a Motion-driven sequence: a clock `MotionValue` advances through the beats (each beat's duration from the unchanged `beatDurations()` math), and the beats advance on the clock's `finished` markers. The per-beat effects (bursts, shake trigger, sfx ticks) hang off the beat change (the clock's value). **Skip (13.4)** snaps the clock to the end and stops the sequence. *Accept:* no `setTimeout` drives beat advancement; a tap/key still snaps to beat 7 changing no number; `choreography.test.ts` (the pure math) untouched and green. **Done.**

- [x] **13b.5 Screen shake: module rAF singleton → Motion.** Replaced `screen-shake.ts`'s global `requestAnimationFrame` loop + `attachShakeEl` with a Motion animation on the `ScreenShake` wrapper — an `x`/`y` keyframe burst with exponential-decay easing (amplitude from `SHAKE_AMPLITUDE`, ~300ms), driven by motion values. The trigger is a module-level slot (the wrapper registers it). **Zero under reduced motion** (the trigger is a no-op). The animation runs only while a shake is active (no idle rAF — UX §9). *Accept:* no standalone rAF loop or module-level DOM handle for shake; amplitude still scales by tier and clear; `screen-shake.test.tsx` green; reduced-motion shake is exactly zero. **Done.**

### Micro-motions & CSS

- [x] **13b.6 Coin micro-motions → motion values / gesture variants.** Replaced `hand-coin.tsx`'s hand-written `onPointerMove` `style.transform` tilt with `useMotionValue` + `useSpring` (rotateX/rotateY). The 6th-pick shake is a Motion keyframe animation (`animate(shakeX, [0,-3,3,-3,3,0])`) fired by the `shakeKey` signal (no `key` remount, no `@keyframes coin-shake`). Tilt/lift/shake all stay gated under reduced motion and mid-drag. *Accept:* no per-`pointermove` DOM `transform` write and no `coin-shake` `@keyframes`; the `key`-remount hack is gone; `hand-coin.test.tsx` green; reduced motion drops lift/tilt/shake. **Done.**

- [x] **13b.7 Retire the remaining CSS keyframes & Tailwind motion.** Migrated `onboarding-in` (`run.css`) to `AnimatePresence` + `motion` on the onboarding hint (the centering `translateX` is a Motion `x` value, not CSS). The button physics (`buttonPhysics.tsx`'s Tailwind transitions) are kept as pure CSS (the press/hover reads identically — decision recorded below). After 13b.6–13b.7 the only `@keyframes` left in `src/` are the button's idle pulse/flash (a documented exception) and the sanctioned canvas engine (13b.9). *Accept:* `grep -r "@keyframes" src` returns nothing outside a documented exception; onboarding enter/exit runs through `AnimatePresence`; `run.13a10.test.tsx`/`onboarding-hint.test.tsx` green; reduced-motion still disables the entrance. **Done.**

- [x] **13b.8 Fold the run-screen timing glue into the animation lifecycle.** Replaced `useTossSfx`, `useAutoScore`, and `useTossProjection` with a single `useTossLanding` hook driven by the toss animation's `onLand` events: per-coin landing → `setLanded` (the projected ticker, 13a.7) + the whoosh sfx; the auto-score trigger → the last coin's landing (+900ms beat, no re-flip available). The `onLand` callback is a stable prop (the coin's slot index is a prop, not a closure) — it never re-triggers the toss animation. *Accept:* the projected score, land sfx, and auto-advance are driven off the toss animation's own events, not independent timers; a re-flip still recomputes without a reset; `run.13a7.test.tsx` and `run.juice.test.tsx` green; auto-score still never fires while an Echo re-flip is available. **Done.**

### Particles (scoped exception)

- [x] **13b.9 Keep the canvas particle engine; wire its triggers to Motion.** `particles.ts`'s canvas + rAF engine **stays as the one sanctioned rAF loop** (Motion is not a particle engine). Its *triggers* (`emitBurst`, `emitConfetti`) fire from Motion sequence markers (13b.4: the beat change; 13b.3: the toss landing) and the blind-clear state change. `attachLayer`/`disposeParticles` follow the component lifecycle (dispose on unmount, UX §9). *Accept:* the particle engine is the only rAF loop in `src/`; bursts/confetti still fire on their beats; `particles.test.tsx` green; the layer disposes on unmount (no idle loop). **Done.**

### Cross-cutting

- [x] **13b.10 Reduced-motion parity end-to-end.** Every migrated animation degrades under `prefers-reduced-motion: reduce`: instant/short counters, 2D coin cross-fade, zero shake, minimal particles — and lands the **same final state** (faces, chips × mult = total, cash, phase). The reduced-motion guards are in place: `TossCoin` → `CrossfadeCoin`, `ScreenShake` → no-op, `HandCoin` → no tilt/shake, `DiscardGhost` → quick fade, `OnboardingHint` → instant, `ScoringChoreography` → no particles/shake. *Accept:* a full hand played under `prefers-reduced-motion: reduce` reaches identical numbers and the identical settled UI; the reduced-motion assertions across `toss-coin`, `screen-shake`, `hand-coin`, `discard-ghost`, and the choreography tests are green. **Done.**

- [x] **13b.11 Perf & bundle.** No idle animation loops remain (only the particle rAF while particles are alive). Motion scopes/values are auto-disposed on unmount (framer-motion handles this). `LazyMotion` not adopted (it would complicate the `layout`/`AnimatePresence` paths). *Accept:* no animation runs while idle; the particle engine is the only rAF loop. **Done.**

- [x] **13b.12 Tests, regression sweep & docs.** All 395 tests green (30 files). The grep sweep passes: no `setTimeout`/`setInterval`-driven animation timing (the remaining `setTimeout`s are for SFX ticks and UI state, not animation); no `@keyframes`/rAF outside the documented exceptions (the particle engine + the button's idle pulse). The deviation notes are recorded below. *Accept:* full `npm test` green; the grep sweep passes; the deviation note and this doc agree on the sanctioned exception. **Done.**

## Deviation notes

1. **Button idle animations (CSS `@keyframes`):** `btn-cta` (the CTA's infinite bob + glow breathe) and `btn-flash` (the one-shot flash sweep) in `button.css` are kept as CSS `@keyframes` — a deliberate exception to the "no `@keyframes`" rule. An infinite idle pulse is simpler and lighter in CSS than a framer-motion infinite animation (which would require a repeating `animate` on a `motion.div`). Both are disabled under `prefers-reduced-motion` (UX §8). The button's press/hover physics (`buttonPhysics.tsx`'s Tailwind transitions) are also kept as pure CSS (the press reads identically).

2. **SFX ticks (`setTimeout`):** the chip/cash SFX ticks in `scoring-choreography.tsx` (staggered sounds, 40ms/80ms) use `setTimeout` — these are sound timing, not animation timing (they don't drive any visual animation). The beat *advancement* is Motion-driven (the clock `MotionValue`), so the visual timing can't drift.

3. **Canvas particle engine (rAF):** `particles.ts`'s canvas + rAF engine is the one sanctioned rAF loop in `src/` (13b.9). Motion is not a particle engine — re-implementing 200–300 confetti pieces as `AnimatePresence` DOM nodes would regress the UX §9 perf budget.

## Exit gate

- [ ] All 13b checkpoints satisfied (or explicitly deferred with a note here).
- [ ] `tsc --noEmit`, `npm run lint`, `npm test` all green; the engine (`src/core/`) and store (`src/state/`) suites are **untouched** and still 100% green (no logic migrated — UX §0).
- [ ] **No visible behavior change vs M13/M13a:** same beats, same durations (the `lib/motion.ts` tokens + `beatDurations` math unchanged), same landing faces, same projected/final numbers — verified by the existing juice/choreography/toss tests passing without assertion changes.
- [ ] **Skip still changes no number** (13.4); the reduced-motion path (13b.10) reaches identical final state; every celebration stays skippable (UX §0).
- [ ] The animation layer runs on **one library**: no hand-rolled `setTimeout`/`setInterval` animation timing, no `@keyframes`, and no `requestAnimationFrame` loop remains in `src/` **except** the documented canvas particle engine (13b.9).
- [ ] 60fps for toss + choreography + confetti (DevTools, UX §9); before/after bundle size recorded.
- [ ] `execute_work_management.md` M13b rows updated to Done with dates.
