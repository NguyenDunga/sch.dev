# Quality Management Plan: 50/50

| Field | Value |
| --- | --- |
| **Project ID** | PRJ-2026-001 |
| **Document** | Quality Management Plan |
| **Version** | 1.0 |
| **Date** | 2026-09-12 |
| **Owner** | BlueCloud (PM) |

This plan is split into small files — one concern per file, readable in isolation.

## Quality Requirements

[Quality Standards](plan_quality-standards.md) — code, test, performance, UX, balance, and reproducibility standards.

## Quality Assurance

- **Code gate:** TypeScript strict + ESLint + Prettier (`tsc` + `npm run lint`), run before every milestone exit.
- **Test gate:** vitest suite 100% passing — [Testing Strategy](plan_testing-strategy.md) (core + game state).

## Quality Control

- [Playtest Protocol](plan_playtest-protocol.md) — 5-item fixed checklist at M2/M3/M4, bug triage (blocker/minor), seeded A/B balance verification.
- [Milestone Quality Gates](plan_quality-gates.md) — full gate: nothing exits on a red gate.

## Change Log

| Date | Change | Approved by | Reason |
| --- | --- | --- | --- |
| 2026-09-12 | Baseline set from quality Q&A rounds 1–2 | BlueCloud | Initial quality plan |
