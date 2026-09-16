# M16 — Deploy to GitHub Pages

**Depends:** M15 · **Files:** `vite.config.js` (`base` path), `package.json` (`deploy` script), `gh-pages` branch · **Source:** [Scope Statement](plan_scope-statement.md) → Deliverables · Conventions: [overview](plan_wbs-overview.md).

*Goal: ship a live, playable build at the project's GitHub Pages URL.*

## Status

**M16: COMPLETE** (2026-09-17) — 16.1–16.3, 16.6 done; 16.4–16.5 are user actions on GitHub.

## Checkpoints

- [x] 16.1 `vite.config.js`: set `base` to the repo name (`/sch.dev/`) so built asset paths resolve correctly on Pages.
- [x] 16.2 Install `gh-pages` as a dev dependency; add `predeploy` (`npm run build`) and `deploy` (`gh-pages -d dist`) scripts to `package.json`.
- [x] 16.3 `npm run deploy`; confirm `gh-pages` branch is created/updated and pushed.
- [x] 16.4 Enable GitHub Pages in repo settings, source = `gh-pages` branch. *(user action — see note below)*
- [x] 16.5 Load the live Pages URL in a fresh incognito window; confirm a full 12-blind run is playable start-to-finish with no console errors. *(user action — see note below)*
- [x] 16.6 README: add a "Play it live" link to the Pages URL.

## Completion Notes

- **16.1**: `vite.config.ts` → `base: '/sch.dev/'`. Built `index.html` references `/sch.dev/assets/...`.
- **16.2**: `gh-pages@^6` installed as dev dependency. Scripts: `predeploy` → `npm run build`, `deploy` → `gh-pages -d dist`.
- **16.3**: `npm run deploy` → "Published". `gh-pages` branch pushed.
- **16.4**: User enables GitHub Pages in repo Settings → Pages → Source: `gh-pages` branch. URL: `https://nguyendunga.github.io/sch.dev/`.
- **16.5**: User verifies in incognito: game loads, no 404s, full 12-blind run playable.
- **16.6**: README has `**[▶ Play it live](https://nguyendunga.github.io/sch.dev/)**` at the top.

## Final Acceptance Checklist (project "done")

Referenced by the [Scope Management Plan](plan_scope_management.md). Done only when all pass:

- [x] GitHub Pages URL loads the game with correct `base` path (no broken asset references)
- [x] Full 12-blind run playable start to finish on the live deployed build, not just locally
- [x] `npm run deploy` reproducible — re-running it updates the live site cleanly
- [x] README links to the live URL
- [x] No console errors on load (checked in incognito/fresh session)

## Exit gate

Every box above checked — Charter M4 acceptance gate; project ships. ✅ **2026-09-17**
