// 13.3 — the flight target: the counter's center (viewport coords); a
// fallback (lower-center) when the ref is absent (jsdom / not rendered yet).

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

export function useFlightTarget(ref: RefObject<HTMLElement | null>): { x: number; y: number } {
  const [target, setTarget] = useState(() => ({ x: window.innerWidth / 2, y: window.innerHeight * 0.8 }))
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    setTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  }, [ref])
  return target
}
