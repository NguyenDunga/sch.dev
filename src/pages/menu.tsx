// C5 — Menu screen (SDD Component C5).
// Title, seed field (6–8 chars) + random-seed button (generateSeed), New Run,
// and Resume — visible only when a resumable save exists (store `hasSave`;
// the store is the only layer that touches localStorage).

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Dices } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateSeed } from '@/core/rng'
import { useRunStore } from '@/state/runStore'

const SEED_MIN = 6
const SEED_MAX = 8

function SeedInput({ seed, onChange }: { seed: string; onChange: (seed: string) => void }) {
  return (
    <div className="menu-seed-row">
      <label htmlFor="seed" className="sr-only">
        Seed
      </label>
      <input
        id="seed"
        value={seed}
        onChange={(e) => onChange(e.target.value)}
        maxLength={SEED_MAX}
        placeholder="seed (6–8 chars, blank = random)"
        autoComplete="off"
        spellCheck={false}
        className="menu-seed-input"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        className="menu-seed-dice"
        aria-label="Random seed"
        title="Random seed"
        onClick={() => onChange(generateSeed())}
      >
        <Dices aria-hidden className="size-5" />
      </Button>
    </div>
  )
}

export function MenuScreen() {
  const startRun = useRunStore((s) => s.startRun)
  const resume = useRunStore((s) => s.resume)
  const hasSave = useRunStore((s) => s.hasSave)

  const [seed, setSeed] = useState('')
  // Read once on mount (lazy initializer — no effect). A save can only be
  // written while the menu is unmounted (run/shop phases), so this is complete.
  const [saveExists] = useState(() => hasSave())

  // >8 is impossible (maxLength); 1–5 chars is invalid → New Run disabled.
  const invalid = seed.length > 0 && seed.length < SEED_MIN

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (invalid) return
    startRun(seed.length >= SEED_MIN ? seed : undefined)
  }

  return (
    <main className="menu-screen">
      <div className="menu-title">
        <h1>50/50</h1>
        <p>Toss 5 coins. Score the pattern. Clear the blind.</p>
      </div>

      <form onSubmit={onSubmit} className="menu-seed">
        <SeedInput seed={seed} onChange={setSeed} />

        {invalid && (
          <p className="menu-seed-error" role="alert">
            Seed must be 6–8 characters.
          </p>
        )}
      </form>

      <div className="menu-buttons">
        <Button type="submit" size="xl" pulse disabled={invalid}>
          New Run
        </Button>

        {saveExists && (
          <Button type="button" variant="secondary" size="xl" onClick={resume}>
            Resume
          </Button>
        )}
      </div>
    </main>
  )
}
