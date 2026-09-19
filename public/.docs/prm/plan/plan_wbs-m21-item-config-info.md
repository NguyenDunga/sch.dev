# M21 — Item Config Registry & Discoverability

**Depends:** M19 · **Files:** `src/config/**` (new — per-item coin/charm files + registry), `src/lib/effect-info.ts` (new), `src/lib/charm-info.ts` (new), `src/components/hand/coin/coin-info/**` (new — context + panel), `src/components/deck/pile-panel.tsx` (new), `src/components/wiki/**` (new — dialog + 4 tabs + button), `src/components/shop/offer/offer-grid.tsx` (new, replaces `offer-card.tsx`), `src/components/shop/trade/trade.tsx`, `src/components/shop/shop.css`, `src/components/run/piles/piles.tsx`, `src/components/hand/coin/coin-glyph/coin-glyph.tsx`, `src/components/hand/hand-coin/hand-coin.tsx`, `src/components/hand/play-slot/play-slot.tsx`, `src/components/charm-bar/charm-chip.tsx`, `src/components/ui/icon.tsx` (`FaceGlyph`), `src/core/balance.ts` (Alternating tier), `scripts/check-structure.mjs` (`CONFIG_MAX_TS`) · **Source of truth:** [SDD](../../sdd/software_design_data.md) · Conventions: [overview](plan_wbs-overview.md).

*Goal: centralize all coin/charm config into per-item files behind a compiler-enforced registry (blurb-as-function, so displayed numbers can't drift from the engine); add a generic hover-info system (per-effect descriptions) across every coin surface; a clickable discard well; a "?" wiki dialog; and a unified inventory-style shop grid. Plus the Alternating tier balance pass (35×3 → 45×4).*

## Design Decisions

1. **Config centralization (per-item files + registry).** Each coin and charm owns one file (`src/config/coins/{effect}.ts`, `src/config/charms/{charm}.ts`) holding a single config object — `{ name, icon, price, blurb(params) }`. `index.ts` aggregates them into `COIN_EFFECTS: Record<CoinEffectKind, CoinEffectConfig>` and `CHARMS: Record<CharmId, CharmConfig>`. The Record key **is** the kind (no `kind` field), so the compiler enforces completeness — a missing file fails the build. `blurb` is a **function of the balance params**, not a string, so the displayed numbers can't drift from the engine. `COIN_CATALOG` / `CHARM_CATALOG` are derived via `Object.entries` (Draw's `params.tiers` expands to 3 catalog entries). The structure check (`scripts/check-structure.mjs`) caps `src/config/**` folders at 15 TS files (`CONFIG_MAX_TS`) to allow the per-item layout.

2. **Generic info system (hover → detail panel).** One hook, `useInfoHover(rows, title)`, and one row shape, `InfoRow { icon, name, blurb }`. The panel renders `rows` + `title` generically (no per-kind lookup), so it serves coins, charms, and hand-size alike. Hover intent is ~600ms rest with a 150ms hide grace; it uses `mouseover`/`mouseout` (bubbling) so it works over `display:contents` wrappers, and the anchor is captured from `getBoundingClientRect()` at hover start. dnd-kit's PointerSensor ignores non-primary buttons, so hover never fights drag.

3. **Clickable discard well.** The discard well is now a button that toggles a `PilePanel` (the same panel used for the draw pile) showing the discarded coins, each with per-coin hover info.

4. **Wiki dialog.** A "?" button (menu, run top bar, shop header) opens a dialog with four tabs: **patterns** (the tier table), **coins** (the catalog), **charms**, and **bosses** (the rules). Content is derived from the config registry + balance tables (single source of truth).

5. **Unified shop grid.** All three offer kinds (charm, coin, handSize) are tiles in one inventory-style grid — a coin-sized icon disc + title + price + **Buy** button. Hovering a tile opens the detail panel (the same `useInfoHover` system). Replaces the old sectioned offer-card layout. Coin offers show their **effect icon** (not the full coin disc) because a Weight coin's facedown glyph depends on the favored face, which is only rolled at purchase. The owned CharmBar stays at the bottom (what you own vs. what you can buy).

6. **Shop scroll architecture.** `.shop-screen` uses a definite `height: 100dvh` (not `min-height`) and a `minmax(0, 1fr)` panel row, so on a short viewport the trade panel scrolls **internally** (one inner `flex-grow:1; min-height:0; overflow-y:auto` region) instead of the whole page scrolling. The `min-height:0` chain from grid row to scroll container is essential; documented in `shop.css` as `SCROLL ARCHITECTURE`.

7. **Balance pass — Alternating tier.** Alternating raised **35×3 → 45×4** (180, 90% of Jackpot's 200 — "almost as good as a jackpot"). EV/hand for a full plain 5-coin play: **58.44 → 63.13** (2020/32 over all 32 five-coin patterns).

8. **Bug fixes (collection consistency + deck/discard split).** Two player-reported state bugs, both fixed the same day:
   - **Keep-unplayed coins were invisible/unsellable in the shop.** The shop's collection was `[...drawPile, ...discardPile]`, which excluded the 13a.2 keep-unplayed hand coins (they live in `st.hand`). So the shop showed a smaller set than the real collection, and the kept coins couldn't be sold — `leaveShop` then merged them back into the deck, so a coin you'd "sold all of" reappeared. **Fix:** `enterShopDraft` merges the keep-unplayed hand coins into the draw pile **when the shop opens** (not at leave), so the Recycler/Forge see and can sell the whole collection; `leaveShop`'s keep-unplayed merge is now a safety net (the hand is empty when the shop opens).
   - **The deck button showed the discard pile too.** `DeckInspector` rendered `[...drawPile, ...discardPile]`, so discarded coins appeared in both the deck panel and the trash-well. **Fix:** the deck shows only the **draw pile** (the remaining coins); the discard pile belongs to the discard well. Title "Your deck" → "Draw pile".
   - **Plain coin face-down glyph** changed from a question mark (`FaCircleQuestion`) to a solid circle (`FaCircle`) — a plain coin has no effect to hide, so the "?" was misleading (the wiki button keeps its own `?`).

## Contract

```ts
// config/types.ts
interface FaceGlyph { icon: ComponentType<IconProps>; color: string }
interface CoinEffectConfig { name: string; icon: FaceGlyph; price: number; blurb: (p: BalanceParams) => string }
interface CharmConfig { name: string; icon: FaceGlyph; price: number; category: CharmCategory; blurb: (p: BalanceParams) => string }

// config/coins/index.ts  (aggregates the per-item files)
export const COIN_EFFECTS: Record<CoinEffectKind, CoinEffectConfig>
export const COIN_CATALOG: CoinDef[]        // derived; Draw's tiers expand to 3 entries

// config/charms/index.ts
export const CHARM_EFFECTS: Record<CharmId, CharmConfig>
export const CHARM_CATALOG: CharmDef[]      // derived

// lib/effect-info.ts
interface InfoRow { icon: ComponentType<IconProps>; name: string; blurb: string }
function effectRows(effect: CoinEffect, params: BalanceParams): InfoRow[]
function charmRows(charm: CharmId, params: BalanceParams): InfoRow[]
function catalogRow(effectId: CoinEffectId, params: BalanceParams): InfoRow

// coin-info-context.ts
function useInfoHover(rows: InfoRow[], title: string): { onMouseOver: (e) => void; onMouseOut: (e) => void }
```

## Checkpoints

- [x] 21.1 Config centralization: per-item files (`src/config/coins/`, `src/config/charms/`) + registry (`index.ts`); `blurb` as a function of balance params; structure-check `CONFIG_MAX_TS = 15` exception for `src/config/**`.
- [x] 21.2 Generic info system: `InfoRow` + `effectRows`/`charmRows`/`catalogRow` (`lib/effect-info.ts`); `useInfoHover(rows, title)` (`coin-info-context.ts`); a generic panel that renders `rows` + `title` (`coin-info.tsx`).
- [x] 21.3 Wire hover info to every coin surface: hand-coin, play-slot, pile-panel, shop offer tile.
- [x] 21.4 Clickable discard well: a button toggling a `PilePanel` of the discarded coins (per-coin hover info).
- [x] 21.5 Wiki dialog: "?" button (menu / run / shop) + four tabs (patterns, coins, charms, bosses), content derived from the registry + balance tables.
- [x] 21.6 Unified shop grid: `OffersGrid` + `OfferTile` (icon disc + title + price + Buy); replaces the sectioned offer-card layout; owned/max/poor states.
- [x] 21.7 Shop scroll fix: `height: 100dvh` + `minmax(0, 1fr)` panel row → internal scroll on short viewports (no page scroll).
- [x] 21.8 Balance: Alternating 35×3 → 45×4 (180); EV/hand 58.44 → 63.13; SDD + balance-baseline re-pinned.
- [x] 21.9 Gate: `tsc` + `eslint` + `check-structure` + `vitest` (613) + `vite build` all green.
- [x] 21.10 Bug fix: keep-unplayed hand coins merged into the draw pile when the shop opens (`enterShopDraft`), so the Recycler/Forge see and can sell the whole collection (they were invisible/unsellable and re-appeared after selling every copy).
- [x] 21.11 Bug fix: the deck button (`DeckInspector`) shows only the draw pile (the remaining coins), not the discard pile (which lives in the discard well); title "Your deck" → "Draw pile".
- [x] 21.12 Plain coin face-down glyph: question mark → solid circle (`FaCircle`).
- [x] 21.13 Doc sync (Double-Side → Heads/Tails): the SDD (`software_design_data.md` `CoinEffect` / `CoinEffectId` / RNG item 6 / `COIN_EFFECTS` count 11→12), the SDD component doc (face resolution + `buy`), and the balance-baseline (coin table Double-Side row → Heads + Tails; resolution order; shop description) were still carrying the pre-M18 `doubleSide`. Updated to match the implemented Heads/Tails (M18 replaced Double-Side with Heads + Tails; the docs lagged).
- [x] 21.14 Shop offer category labels: each offer tile now shows a small tinted badge (Coin / Charm / Hand Size) so the offer type reads at a glance (coin = gold, charm = purple, hand = teal).

## Exit gate

`tsc` + `eslint` + `check-structure` + `vitest` (613 tests) + `vite build` all green; hovering any coin surface (hand / play / pile / shop offer) shows its per-effect descriptions; the discard well is clickable and lists the discarded coins; the "?" wiki opens from the menu, run and shop with four tabs; the shop offers render as one inventory-style grid (icon + title + price + Buy); the trade panel scrolls internally on a short viewport; the config registry is compiler-complete (a missing per-item file fails the build); the displayed blurbs match the engine (blurb-as-function).

## Status — DONE (2026-09-19)

- **Config centralization:** one file per coin/charm behind `COIN_EFFECTS` / `CHARMS` Records; `blurb(params)` kills number drift; `COIN_CATALOG` / `CHARM_CATALOG` derived; `check-structure.mjs` allows 15 TS in `src/config/**`.
- **Info system:** generic `useInfoHover(rows, title)` + `InfoRow`; the panel renders rows generically (works for coins, charms, hand-size, shop offers); wired to all four coin surfaces.
- **Discard well:** now a button toggling a `PilePanel` of the discarded coins.
- **Wiki:** four-tab dialog (patterns / coins / charms / bosses) from a "?" button on the menu, run and shop.
- **Unified shop grid:** all three offer kinds as tiles (icon disc + title + price + Buy); hover → detail; owned/max/poor states; replaces the sectioned offer-card layout.
- **Shop scroll:** `height: 100dvh` + `minmax(0, 1fr)` → internal scroll on short viewports.
- **Balance:** Alternating 35×3 → 45×4 (180, 90% of Jackpot's 200); EV/hand 58.44 → 63.13.
- **Bug fixes:** keep-unplayed hand coins now merge into the draw pile when the shop opens (visible + sellable in the Recycler/Forge — they were invisible and re-appeared after selling every copy); the deck button shows only the draw pile (the discard pile lives in the discard well); plain coin face-down glyph is a solid circle (was a question mark).
- **Doc sync:** Double-Side → Heads/Tails across the SDD + balance-baseline (the pre-M18 `doubleSide` was still in the docs; M18 replaced it with Heads + Tails in code).
- **Shop category labels:** each offer tile shows a tinted Coin / Charm / Hand Size badge so the offer type reads at a glance.
- Exit gate: `tsc` + `eslint` + `check-structure` + `vitest` (613/613) + `vite build` all green.

## Process notes

- When uncertain, ask **directly in plain text** — don't loop on the question tool.
- Keep responses concise; don't repeat yourself.
- The M20 tutorial doc was authored under `dist/.docs/` (gitignored build output) and was wiped by a `vite build`; this milestone's docs live under the tracked `public/.docs/`.
