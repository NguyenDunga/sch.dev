# M15 — README & Final Packaging

**Depends:** M12, M14 · **Files:** `README.md` (repo root), the built output · **Source:** [Scope Statement](plan_scope-statement.md) → Deliverables · Conventions: [overview](plan_wbs-overview.md).

*Goal: ship the deliverables exactly as listed in the Scope Statement.*

## Checkpoints

- [ ] 15.1 README: install + `npm run dev` / `npm run build`.
- [ ] 15.2 README: enter a custom seed + share a seed (copy the 6–8 char string).
- [ ] 15.3 `npm run build`; confirm a full 12-blind run is playable start-to-finish on the built output.
- [ ] 15.4 `npm run test` 100% passing.
- [ ] 15.5 Out-of-scope audit: grep for multiplayer, online, hosting/Steam, music files, localization, achievements, leaderboards — zero matches.

## Final Acceptance Checklist (project "done")

Referenced by the [Scope Management Plan](plan_scope_management.md). Done only when all pass:

- [ ] `npm run build` works; full 12-blind run playable start to finish
- [ ] vitest suite 100% green; seeded runs reproducible (M14.3)
- [ ] README complete; manual save/resume verified across sessions (close → reopen → continue)
- [ ] All 4 boss rules, 5 charms, coin deck (discard + draw-enchant + effects), and shop (reroll + merge/remove + hand-size upgrade) work end to end
- [ ] Out-of-scope audit (15.5) returns zero matches

## Exit gate

Every box above checked — Charter M4 acceptance gate; project ships.
