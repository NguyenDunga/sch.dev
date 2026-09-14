# M12 — UI Screens

**Depends:** M1–M11 · **Files:** `src/pages/` (menu, run, shop, run-end), `src/components/`, `src/state/runStore.ts` · **Source:** [Scope Statement](plan_scope-statement.md) → In Scope (UI) · Conventions: [overview](plan_wbs-overview.md).

*Goal: wire the engine to screens. UI is a thin layer — screens dispatch engine actions and render `RunState`; no game logic (scores/tiers/draws) in components.*

The store (zustand + immer + persist) holds `RunState` and exposes the M4 `HandAction` dispatchers, M9 shop actions, and M11 save/load.

## Checkpoints

- [ ] 12.1 Menu: New Run (M2 `generateSeed` or custom seed) + Continue (M11 `loadRun`, disabled if no save).
- [ ] 12.2 Run — Draw/Play: hand face-down, select 1–5, discard, show `handsLeft` + `blindTarget` vs `blindTotal`.
- [ ] 12.3 Run — Toss/Buff: flip reveal, Echo re-flip (once per Echo coin), charm bar drag-to-reorder (@dnd-kit) → M8.
- [ ] 12.4 Run — Score: explicit Score button (no auto-timer), tier/base/boosters breakdown, chips×mult — equals M6 result.
- [ ] 12.5 Shop: 5 slots, reroll (disabled after first use), merge, remove, money.
- [ ] 12.6 Game Over: final stats + seed; New Run + Menu.
- [ ] 12.7 Manual Save button (Run screen) → M11 `saveRun`; no autosave.
- [ ] 12.8 Flat-art styling (Tailwind + shadcn/ui); no illustrative art.
- [ ] 12.9 Smoke tests: each screen renders from a valid `RunState` without throwing.

## Exit gate

`npm run test` green incl. smoke tests; every screen renders from a valid `RunState`; a full run is playable end-to-end through the UI. (Charter M3: playtest 5/5.)
