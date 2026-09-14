// Store plumbing types shared by the action modules (handActions, shopActions,
// saveActions) and the store wiring (runStore).

import type { WritableDraft } from 'immer'
import type { RunState } from '@/core/types'

/** The immer draft of the run state (what `set` mutators receive). */
export type Draft = WritableDraft<RunState>
/** The store's `set` (immer mutator form). */
export type SetFn = (mutate: (st: Draft) => void) => void
/** The store's `get`. */
export type GetFn = () => RunState
