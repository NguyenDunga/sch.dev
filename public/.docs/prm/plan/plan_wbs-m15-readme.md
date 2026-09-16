# M15 — README & Final Packaging

**Depends:** M12, M14 · **Files:** `README.md` (repo root), the built output · **Source:** [Scope Statement](plan_scope-statement.md) → Deliverables · Conventions: [overview](plan_wbs-overview.md).

*Goal: ship the deliverables exactly as listed in the Scope Statement.*

## Status

**M15: COMPLETE** (2026-09-17)

## Checkpoints

- [x] 15.1 README: install + `npm run dev` / `npm run build`.
- [x] 15.2 README: enter a custom seed + share a seed (copy the 6–8 char string).
- [x] 15.3 `npm run build`; confirm a full 12-blind run is playable start-to-finish on the built output.
- [x] 15.4 `npm run test` 100% passing.
- [x] 15.5 Out-of-scope audit: grep for multiplayer, online, hosting/Steam, music files, localization, achievements, leaderboards — zero matches.

## Completion Notes

- **15.1**: `README.md` rewritten with Quick Start (install/dev/build/test/lint), How to Play, Seed Sharing, Save/Resume, Project Structure, Tech Stack, Accessibility, License.
- **15.2**: Seed Sharing section explains copy/enter of the 6–8 char seed string; no account or server needed.
- **15.3**: `npm run build` → `tsc -b && vite build` clean; 564 kB / 181 kB gzip. Full 12-blind run playable.
- **15.4**: 423 tests / 33 files, 100% green.
- **15.5**: Zero matches for multiplayer, multi-player, online, steam, hosting, localization, i18n, l10n, achievement, leaderboard, leader-board, music.

## Final Acceptance Checklist (project "done")

Referenced by the [Scope Management Plan](plan_scope_management.md). Done only when all pass:

- [x] `npm run build` works; full 12-blind run playable start to finish
- [x] vitest suite 100% green; seeded runs reproducible (M14.3)
- [x] README complete; manual save/resume verified across sessions (close → reopen → continue)
- [x] All 4 boss rules, 5 charms, coin deck (discard + draw-enchant + effects), and shop (reroll + merge/remove + hand-size upgrade) work end to end
- [x] Out-of-scope audit (15.5) returns zero matches

## Exit gate

Every box above checked — Charter M4 acceptance gate; project ships. ✅ **2026-09-17**
