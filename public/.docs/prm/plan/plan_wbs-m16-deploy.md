# M16 — Deploy to GitHub Pages

**Depends:** M15 · **Files:** `vite.config.js` (`base` path), `package.json` (`deploy` script), `gh-pages` branch · **Source:** [Scope Statement](plan_scope-statement.md) → Deliverables · Conventions: [overview](plan_wbs-overview.md).

*Goal: ship a live, playable build at the project's GitHub Pages URL.*

## Checkpoints

- [ ] 16.1 `vite.config.js`: set `base` to the repo name (`/repo-name/`) so built asset paths resolve correctly on Pages.
- [ ] 16.2 Install `gh-pages` as a dev dependency; add `predeploy` (`npm run build`) and `deploy` (`gh-pages -d dist`) scripts to `package.json`.
- [ ] 16.3 `npm run deploy`; confirm `gh-pages` branch is created/updated and pushed.
- [ ] 16.4 Enable GitHub Pages in repo settings, source = `gh-pages` branch.
- [ ] 16.5 Load the live Pages URL in a fresh incognito window; confirm a full 12-blind run is playable start-to-finish with no console errors (missing assets, 404s, broken paths).
- [ ] 16.6 README: add a "Play it live" link to the Pages URL.

## Final Acceptance Checklist (project "done")

Referenced by the [Scope Management Plan](plan_scope_management.md). Done only when all pass:

- [ ] GitHub Pages URL loads the game with correct `base` path (no broken asset references)
- [ ] Full 12-blind run playable start to finish on the live deployed build, not just locally
- [ ] `npm run deploy` reproducible — re-running it updates the live site cleanly
- [ ] README links to the live URL
- [ ] No console errors on load (checked in incognito/fresh session)

## Exit gate

Every box above checked — Charter M4 acceptance gate; project ships.