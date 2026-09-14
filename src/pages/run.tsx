import { Coin } from '@/components/hand/coin'
import { ScoreTicker } from '@/components/hand/score-ticker'
import { Button } from '@/components/ui/button'
import { BLINDS } from '@/core/balance'
import { useRunStore } from '@/state/runStore'

const BLIND_NAMES = { small: 'Small', big: 'Big', boss: 'Boss' } as const

export function RunScreen() {
  const seed = useRunStore((s) => s.seed)
  const hand = useRunStore((s) => s.hand)
  const tosses = useRunStore((s) => s.tosses)
  const handState = useRunStore((s) => s.handState)
  const deck = useRunStore((s) => s.deck)
  const blindIndex = useRunStore((s) => s.blindIndex)
  const handsLeft = useRunStore((s) => s.handsLeft)
  const blindScore = useRunStore((s) => s.blindScore)
  const lastScore = useRunStore((s) => s.lastScore)
  const tossSlot = useRunStore((s) => s.tossSlot)
  const openTossWindow = useRunStore((s) => s.openTossWindow)
  const echoReflip = useRunStore((s) => s.echoReflip)
  const discard = useRunStore((s) => s.discard)
  const score = useRunStore((s) => s.score)
  const toMenu = useRunStore((s) => s.toMenu)

  const blind = BLINDS[blindIndex]
  const inTossWindow = handState === 'tossed'
  const pileEmpty = deck.drawPile.length === 0
  const tossedCount = hand.filter((h) => h !== null).length

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <header className="flex items-baseline gap-3">
        <span className="font-heading text-lg font-semibold">50/50</span>
        <span className="text-xs text-muted-foreground">{seed}</span>
      </header>

      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-heading text-sm font-semibold">
          Round {blind.round} · {BLIND_NAMES[blind.kind]} Blind
        </span>
        <span className="text-xs text-muted-foreground">
          Target {blind.target} · Score {blindScore} · {handsLeft} hands ·{' '}
          {deck.drawPile.length} in deck
        </span>
      </div>

      <div className="flex gap-3">
        {hand.map((slot, i) => {
          const echoAvailable =
            inTossWindow &&
            slot !== null &&
            slot.coin.effects.includes('echo') &&
            !slot.echoUsed
          const tappable =
            (handState === 'ready' && slot === null && !pileEmpty) ||
            (inTossWindow && slot !== null)
          return (
            <Coin
              key={i}
              face={slot?.face ?? null}
              effects={slot?.coin.effects ?? []}
              echoAvailable={echoAvailable}
              tosses={tosses[i]}
              index={i}
              tappable={tappable}
              onTap={() => {
                if (inTossWindow && slot !== null) {
                  if (echoAvailable) echoReflip(i)
                  else discard(i)
                } else {
                  tossSlot(i)
                }
              }}
            />
          )
        })}
      </div>

      <ScoreTicker score={lastScore} />

      <div className="flex flex-col items-center gap-2">
        {inTossWindow ? (
          <>
            <span className="text-xs text-muted-foreground">
              Tap a coin to discard it — enchanted coins redraw
            </span>
            <Button size="lg" pulse onClick={score}>
              Score
            </Button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">
              {pileEmpty
                ? 'Deck is empty — score what you have'
                : tossedCount > 0
                  ? `Tossed ${tossedCount} of 5 — tap more coins or confirm`
                  : 'Tap coins to toss (play 1–5)'}
            </span>
            {tossedCount > 0 && (
              <Button size="lg" onClick={openTossWindow}>
                Confirm
              </Button>
            )}
          </>
        )}
        <Button variant="ghost" size="sm" onClick={toMenu}>
          Menu
        </Button>
      </div>
    </main>
  )
}
