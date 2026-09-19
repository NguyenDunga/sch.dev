// Coin info — the context + the hover-intent handler hook (no JSX: the
// provider/panel live in coin-info.tsx, the react-refresh rule). Resting the
// pointer on a coin for HOVER_DELAY_MS shows the panel; leaving schedules a
// hide (with a grace so the pointer can reach the panel).
//
// Built on `mouseover`/`mouseout` (bubbling) rather than `mouseenter`/
// `mouseleave` so it also works on a `display: contents` wrapper (the
// revealed play slot), which has no box of its own. The anchor rect falls
// back to the hit target when the surface itself has no box. Outside the
// provider the handlers are no-ops (the debug pages render coins without it).

import { createContext, useContext, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { InfoRow } from '@/lib/effect-info'

/** How long the pointer must rest on a coin before the panel shows. */
export const HOVER_DELAY_MS = 600
/** Hide grace after the pointer leaves (lets it cross the gap onto the panel). */
export const HIDE_GRACE_MS = 150

/** The coin's on-screen box (captured at hover start). */
export interface CoinInfoAnchor {
  top: number
  bottom: number
  left: number
  width: number
}

export interface CoinInfoContextValue {
  show: (rows: InfoRow[], title: string, anchor: CoinInfoAnchor) => void
  scheduleHide: () => void
}

export const CoinInfoContext = createContext<CoinInfoContextValue | null>(null)

/** Hover-intent handlers for an info surface (coin / charm / hand-size offer). */
export function useInfoHover(rows: InfoRow[], title: string) {
  const ctx = useContext(CoinInfoContext)
  const timer = useRef<number | null>(null)

  const cancel = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
  }

  useEffect(() => cancel, [])

  const onMouseOver = (e: ReactMouseEvent<HTMLElement>) => {
    if (!ctx || timer.current !== null) return
    // A `display: contents` surface has no box — anchor to the hit target.
    const r = e.currentTarget.getBoundingClientRect()
    const rect = r.width > 0 ? r : (e.target as HTMLElement).getBoundingClientRect()
    const anchor: CoinInfoAnchor = { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width }
    timer.current = window.setTimeout(() => {
      timer.current = null
      ctx.show(rows, title, anchor)
    }, HOVER_DELAY_MS)
  }

  const onMouseOut = (e: ReactMouseEvent<HTMLElement>) => {
    // Still inside the surface (moved to a child) → keep the timer running.
    const related = e.relatedTarget as Node | null
    if (related && e.currentTarget.contains(related)) return
    cancel()
    ctx?.scheduleHide()
  }

  return { onMouseOver, onMouseOut }
}
