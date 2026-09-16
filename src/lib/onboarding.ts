// 13a.10 — the first-run onboarding flag. The store is the only layer that
// persists RUN STATE (the save file, `fifty-fifty-run`); this is a UI
// preference — has the player seen the first-run hint — so it lives in its
// own key, never in the save file.

const KEY = 'fifty-fifty-onboarded'

/** True once the first-run hint has been shown (or dismissed). */
export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return true // no storage (private mode / node) — don't nag
  }
}

/** Persist that the hint was seen (set on first show and on dismiss). */
export function markOnboardingSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // no storage — the hint simply shows once per session
  }
}
