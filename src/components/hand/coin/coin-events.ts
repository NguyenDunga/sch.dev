// Coin event hooks — 7 lifecycle events (no audio, just callbacks).
//
// These are placeholder hooks for future sound/SFX integration. Each event
// is a simple callback that fires at the appropriate lifecycle moment.
//
// Events:
//   onMount    — coin appears in the hand (deal)
//   onToss     — coin is tossed (face revealed)
//   onLand     — coin lands (toss animation complete)
//   onPick     — coin is picked into a play slot
//   onDiscard  — coin is discarded
//   onScore    — coin contributes to a score
//   onEffect   — an effect is applied/triggered on the coin

import type { Face } from '@/core/types'

/** The 7 coin event types. */
export type CoinEventType =
  | 'mount'
  | 'toss'
  | 'land'
  | 'pick'
  | 'discard'
  | 'score'
  | 'effect'

/** Event payload — carries context about what happened. */
export interface CoinEventPayload {
  /** The coin's id. */
  coinId: string
  /** The face (if relevant). */
  face?: Face
  /** The effect kind (for 'effect' events). */
  effectKind?: string
  /** Timestamp (performance.now()). */
  timestamp: number
}

/** A single event handler. */
export type CoinEventHandler = (payload: CoinEventPayload) => void

/** The 7 event hooks. */
export interface CoinEventHooks {
  onMount?: CoinEventHandler
  onToss?: CoinEventHandler
  onLand?: CoinEventHandler
  onPick?: CoinEventHandler
  onDiscard?: CoinEventHandler
  onScore?: CoinEventHandler
  onEffect?: CoinEventHandler
}

/**
 * Fire a coin event. Safe to call with no hooks (no-op).
 */
export function fireCoinEvent(
  hooks: CoinEventHooks,
  type: CoinEventType,
  payload: Omit<CoinEventPayload, 'timestamp'>,
): void {
  const key = `on${type[0].toUpperCase()}${type.slice(1)}` as keyof CoinEventHooks
  const handler = hooks[key]
  if (!handler) return
  handler({ ...payload, timestamp: performance.now() })
}
