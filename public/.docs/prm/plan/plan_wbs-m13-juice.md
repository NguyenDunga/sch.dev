# M13 — Juice (Choreography, Particles, Shake & Sound)

**Depends:** M12 · **Files:** `src/components/` (juice: choreography, particles, screen-shake, sfx), SFX in `public/resource/sfx/` · **Source of truth:** [SDD UX / Interaction & Juice](../../sdd/software_design_ux.md) §0, §5–§10; [Component Design](../../sdd/software_design_component.md) C10 · Conventions: [overview](plan_wbs-overview.md).

*Goal: Balatro-grade payoff — the scoring choreography, particles, screen shake, and expanded sound — all purely presentational. Build to the UX doc's beat/timing/sfx tables.*

**Boundary (UX §0):** juice reads `lastScore`/`RunState`, never mutates state, never gates an action, and is always **skippable** (a skip snaps to the settled end, changing no number). The 3D coin always lands on the engine's `Slot.face`.

## Checkpoints

- [x] 13.1 **Deal/pick/discard motion** — `deal`, `pick`, `unpick`, `discard` animations per the [UX §5 table](../../sdd/software_design_ux.md) (springs, staggers).
- [x] 13.2 **Toss + Echo** — the 3D flip/settle and single-coin echo re-toss (M12.5 plumbing) tuned to `spring-bouncy`; lands on `Slot.face`.
- [x] 13.3 **Scoring choreography** — the 7-beat sequence in [UX §6](../../sdd/software_design_ux.md): reveal/match pulse → tier banner slam → chips build (flying chips + pitch-rising ticker) → mult flare → resolve (collide + total count-up) → cash fly → settle. Driven by `lastScore`.
- [x] 13.4 **Skip/fast-forward** — a tap/key during the sequence jumps to the settled end state; verify no number changes vs. letting it play out.
- [x] 13.5 **Particles** — chip bursts, coin sparkles, cash coins, and canvas-confetti on blind clear ([UX §7](../../sdd/software_design_ux.md)); colors from the active tier tokens.
- [x] 13.6 **Screen shake** — amplitude scaled by tier with exponential decay (UX §7); **zero** under reduced-motion.
- [x] 13.7 **Sound map** — howler SFX for every event in the [UX §10 table](../../sdd/software_design_ux.md) (deal, pick/unpick, discard, toss/land ±5% rate, tier hit, chip tick rising pitch, mult, cash, button/reroll/buy, error, win/lose stingers); concurrency cap + ducking; **no music**. CC0 assets in `public/resource/sfx/`.
- [ ] 13.8 **Reduced motion / a11y** — `prefers-reduced-motion` path per [UX §8](../../sdd/software_design_ux.md): 2D coin, no shake, minimal particles, fast counters; colorblind-safe H/T; same final numbers.
- [ ] 13.9 **Perf** — 60fps for toss + choreography + confetti; three/r3f/rapier code-split; `frameloop="demand"`; dispose on unmount; input never blocked (UX §9).

## Exit gate

60fps, no jank (DevTools); the scoring choreography and sound read as escalating and satisfying; **skip changes no number**; reduced-motion path verified; engine + store tests still 100% green (no logic touched); no music. (Charter M4: 60fps.)
