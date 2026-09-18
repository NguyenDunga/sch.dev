// UI Debug — the /debug page: every component in src/components/ui gets a
// section here. The Button sections live in debug-buttons.tsx (150-LOC
// file rule).

import { useState } from 'react'
import { withIcon } from '@/components/ui/icon'
import { FaMoon, FaSun } from 'react-icons/fa6'
import { Button } from '@/components/ui/button'
import { ButtonSections } from './buttons'

const MoonIcon = withIcon(FaMoon)
const SunIcon = withIcon(FaSun)

export function DebugPage() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3">
          <div>
            <h1 className="font-heading text-lg font-semibold">
              UI Debug
            </h1>
            <p className="text-xs text-muted-foreground">
              Every component in <code>src/components/ui</code> gets a section
              here
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={() => {
                const next = !dark
                document.documentElement.classList.toggle('dark', next)
                setDark(next)
              }}
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </Button>
            <Button variant="link" onClick={() => (window.location.href = '/')}>
              ← Home
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-6">
        <ButtonSections />
      </main>
    </div>
  )
}
