# M0 — Project Setup & Tooling

**Depends:** — · **Files:** repo root, `src/` tree · **Source:** [Charter](../init/init_project_charter.md) §4 · Conventions: [overview](plan_wbs-overview.md).

*Goal: a running skeleton — builds, runs, tests clean. Nothing game-specific yet.*

## Checkpoints

- [x] 0.1 Scaffold Vite + React + TS (`react-ts`) at repo root, absorbing the existing `package.json`.
- [x] 0.2 Install + configure Tailwind CSS (directives in `src/index.css`).
- [x] 0.3 Install + configure shadcn/ui (base components only, no theme).
- [x] 0.4 Install `@dnd-kit/sortable` + `@dnd-kit/core`.
- [x] 0.5 Install `pure-rand`.
- [x] 0.6 Install `vitest` + `@testing-library/react`; add `"test": "vitest run"`.
- [x] 0.7 Create folders: `src/core/`, `src/state/`, `src/components/`, `src/pages/`, `src/lib/`. Tests colocated as `*.test.ts`.
- [x] 0.8 `npm run dev` renders a "Hello 50/50" page, no console errors.
- [x] 0.9 `npm run build` exits 0; `dist/` previews.
- [x] 0.10 `npm run test` exits 0 at zero tests.

## Exit gate (Charter M1)

`tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test` all exit 0.
