# M1 — Scaffold (target 2026-09-19)

Goal: charter-approved repo with a working toolchain — ready to build the vertical slice on top.

| ID | Component | Done means |
| --- | --- | --- |
| 1.1 | Project scaffold | `npm create vite@latest` (React + TS); Tailwind + shadcn/ui (copy-in components) installed and rendering a test page |
| 1.2 | State store | zustand + immer + persist middleware wired; a dummy store persists across reload |
| 1.3 | Seeded RNG | pure-rand wrapper: `createRng(seed)` → `next()`; same seed → same sequence (unit-tested) |
| 1.4 | Tests + scripts | vitest running (`npm test`); npm scripts: dev / build / test |

**Exit criteria:** `npm run dev` renders the test page; `npm test` passes; the store persists a value across reload.

Charter milestone: M1.
