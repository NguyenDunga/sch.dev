# M13 — Juice (Animation & SFX)

**Depends:** M12 · **Files:** `src/components/` (animation layers), SFX in `public/` · **Source:** [Scope Statement](plan_scope-statement.md) → In Scope (Juice) · Conventions: [overview](plan_wbs-overview.md).

*Goal: add feel without touching engine logic — purely presentational. No juice may alter engine state or timing.*

## Checkpoints

- [ ] 13.1 Coin-toss flip animation during Toss.
- [ ] 13.2 Animated chips×mult ticker counting up during Score.
- [ ] 13.3 Confetti on blind clear (canvas-confetti).
- [ ] 13.4 SFX: coin toss, win stinger, lose stinger (howler). No music.
- [ ] 13.5 Confirm juice is visual/audio only — no animation gates `confirmScore()` or mutates state.

## Exit gate

60fps, no jank (DevTools); engine tests still 100% green (no logic touched); no music present. (Charter M4: 60fps.)
