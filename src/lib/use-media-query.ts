// M23 — a tiny matchMedia hook (responsive component choice, e.g. the wiki's
// Sheet-on-phone / Dialog-on-desktop split). Defensive: environments without
// matchMedia (jsdom) return `fallback` (default true = desktop).

import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string, fallback = true): boolean {
  const subscribe = (cb: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
    const mql = window.matchMedia(query)
    mql.addEventListener('change', cb)
    return () => mql.removeEventListener('change', cb)
  }
  return useSyncExternalStore(
    subscribe,
    () => (typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : fallback),
    () => fallback,
  )
}
