import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { attachShakeEl } from './screen-shake'

/** The shaken wrapper (the app root — the resolve shake and the target-clear
 *  shake both move the whole screen). */
export function ScreenShake({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    attachShakeEl(ref.current)
    return () => attachShakeEl(null)
  }, [])
  return (
    <div className="screen-shake" ref={ref}>
      {children}
    </div>
  )
}
