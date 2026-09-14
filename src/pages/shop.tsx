// Placeholder — Shop screen (SDD Component C8; WBS M9 logic + M12.7 UI).
// TODO: 5 offer cards, reroll (1 free), merge, remove, hand-size upgrade,
// collection view, cash, Leave. Reads RunState; dispatches store shop actions.
export function ShopScreen() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="font-heading text-3xl font-bold">Shop</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder — offers, reroll, merge/remove land in M9 / M12.
      </p>
    </main>
  )
}
