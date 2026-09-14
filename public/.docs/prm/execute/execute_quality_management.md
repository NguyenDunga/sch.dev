# Control Quality: 50/50
| Field | Value |
| --- | --- |
| **Project ID** | PRJ-2026-001 |
| **Document** | Control Quality |
| **Version** | 1.0 |
| **Date** | 2026-09-12 |
| **Owner** | BlueCloud (PM) |
This is the execution process for **controlling quality** — monitoring and recording the results of applying the [Quality Management Plan](../plan/plan_quality_management.md) to the work in progress, and verifying that outputs meet the [Quality Standards](../plan/plan_quality-standards.md). The plan defines *what* quality is; this file records *how quality was actually checked* during execution.

## Quality Control Activities

Quality is checked at every milestone exit via the [Milestone Quality Gates](../plan/plan_quality-gates.md). Run the gate, record the result, and only exit a milestone on a green gate.

| Milestone | Gate | Check | Result | Date |
| --- | --- | --- | --- | --- |
| M1 | Code | `tsc` + `npm run lint` | Pass | 2026-09-12 |
| M1 | Test | `npm run test` (vitest) | Pass (8/8) | 2026-09-12 |
| M2 | Code | `tsc` + `npm run lint` | | |
| M2 | Test | `npm run test` (vitest) | | |
| M2 | Playtest | [Playtest Protocol](../plan/plan_playtest-protocol.md) | | |
| M3 | Code | `tsc` + `npm run lint` | | |
| M3 | Test | `npm run test` (vitest) | | |
| M3 | Playtest | [Playtest Protocol](../plan/plan_playtest-protocol.md) | | |
| M4 | Code | `tsc` + `npm run lint` | | |
| M4 | Test | `npm run test` (vitest, 100%) | | |
| M4 | Playtest | [Playtest Protocol](../plan/plan_playtest-protocol.md) | | |

Result values: `Pass` · `Fail` · `N/A`.

## Verified Deliverables

Record which deliverables passed quality control and are verified.

| Deliverable | Milestone | Verified by | Date | Notes |
| --- | --- | --- | --- | --- |
| | | | | |
