// 13a.10 — first-run onboarding hint. The 13a.5–13a.7 input model (drag to
// play, drag to the bin, match a pattern) is opaque to a first-time player:
// a small sticker banner explains the three core gestures. Shown only on
// the first run (the localStorage flag is set when it appears and on
// dismiss — lib/onboarding), never blocks input (pointer-events: none except
// on the × button), and the entrance is a plain fade (no motion under
// prefers-reduced-motion, UX §8). Purely presentational — it reads/writes a
// UI flag only; the store is untouched (UX §0).

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { hasSeenOnboarding, markOnboardingSeen } from '@/lib/onboarding'

/** The three core gestures of the 13a input model. */
const HINT_TEXT = 'Drag a coin to the play row to pick it · drag it into the bin to discard · match a pattern to score'

/** A dismissible sticker banner, shown only on the first run. */
export function OnboardingHint() {
  const [visible, setVisible] = useState(() => !hasSeenOnboarding())
  // First show = seen: persist immediately (the hint never comes back).
  useEffect(() => {
    if (visible) markOnboardingSeen()
  }, [visible])
  if (!visible) return null
  return (
    <div className="onboarding-hint" role="note" aria-label="Getting started">
      <p>{HINT_TEXT}</p>
      <button
        type="button"
        className="onboarding-hint-close"
        onClick={() => {
          markOnboardingSeen()
          setVisible(false)
        }}
        aria-label="Dismiss hint"
      >
        <X size={16} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}
