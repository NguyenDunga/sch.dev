# M11 — Save / Load

**Depends:** M10 · **File:** `src/state/runStore.ts` (persist + `save`/`resume`) (+`.test.ts`) · **Source of truth:** [SDD Data Design](../../sdd/software_design_data.md) → Persistence; [SDD Component Design](../../sdd/software_design_component.md) C4 · Conventions: [overview](plan_wbs-overview.md).

*Goal: manual localStorage save, resume at blind start only. No autosave. The store is the only place that touches `localStorage`.*

## Contract (SDD C4 + Data Design)

```ts
save()    // serialize { version: 2, state: RunState } (incl. rngState + collection) to localStorage key 'fifty-fifty-run'; explicit only
resume()  // restore; reset current-blind progress to blind start (or resume at shop if saved there)
```

Persisted shape `{ version: 2, state: RunState }`; v1 saves are discarded (not migratable). See the SDD **Resume semantics** for exactly what is preserved vs reset — including the open **determinism note** (resume re-reshuffles from the current `rngState`, so a resumed blind differs from the pre-save pile; a save can re-roll a blind unless the pre-shuffle state is snapshotted). Implement per the SDD as written; flag if the determinism behaviour should change.

## Checkpoints

- [ ] 11.1 `save()` — write `{version:2, state}` to `fifty-fifty-run`; explicit calls only.
- [ ] 11.2 `resume()` — restore; `null`/absent/parse-fail → no-op (Resume button hidden when no save).
- [ ] 11.3 Resume in `run`: reset `handsLeft`/`blindScore` to blind-start, reshuffle (clear discard); preserve seed, round/blind, cash, charms+order, collection, rngState, runScore.
- [ ] 11.4 Resume in `shop`: land at the shop with offers regenerated identically from `rngState`.
- [ ] 11.5 Test: `save` → `resume` (fresh store) deep-equals the persisted fields.
- [ ] 11.6 Test: no phase transition calls `save` (spy `not.toHaveBeenCalled`).

## Exit gate

`npx vitest run src/state/runStore.test.ts` green (save subset); round-trip equal; resume at blind start / shop; no autosave on any transition path.
