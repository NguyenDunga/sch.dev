// 13a.11 — playtest: hand-economy balance on the 4-hand blind.
//
// Headless simulation driven by the REAL store (createRunStore — the same
// code path as the UI; no engine mutation, UX §0). The "player" is a
// face-blind greedy policy: each hand it evaluates every subset of the hand
// (1–5 coins) by EXPECTED score — the average over all face assignments,
// weighted by each coin's effect odds (the player sees effects, never faces)
// — and plays the best subset. No discards (keep-unplayed, 13a.2), no shop
// buys (measures the base game).
//
// Tests:
//   1. EV-math cross-checks — the inlined EV (faceProbs × maskTotal) must
//      match the real pipeline: maskTotal === scoreHand.total for every
//      pattern/boss/charm set; faceProbs === resolveFace distribution
//      (Monte Carlo); expectedScore === Monte-Carlo rolls of the real
//      resolveFace + scoreHand (catches any context/odds/tier divergence).
//   2. Per-blind clear rates, base hands vs +1 hand (200 runs/cell) — the
//      Extra Hand with/without data (the 13a.11 playtest note).
//   3. Full-run completion (context: the base game is a build-gate).
//   4. Round-2 boss (Short Fuse, 750) — the 3-hand cut and the max-score
//      wall (3×200 = 600 < 750: unclearable without boosters; a
//      jackpot-gate with them).
//
// Performance: the EV uses per-coin face-prob tables (precomputed per hand)
// and an inlined tier evaluator over the face mask (no scoreHand / array
// allocation per mask) — ~100x faster than the naive loop.

import { describe, expect, it } from 'vitest'
import { createRunStore } from '@/state/runStore'
import {
  BLINDS,
  HANDS_PER_BLIND,
  HAND_SIZE,
  JACKPOT_CHANCE,
  JACKPOT_PAYOUT,
  JACKPOT_FEVER_MULT,
  MAGNETIC_ODDS,
  PLAY_SIZE,
  PLUS_CHIPS_BONUS,
  PLUS_MULT_BONUS,
  SHORT_FUSE_HANDS,
  WEIGHT_ODDS,
} from '@/core/balance'
import { isFilled, none, some, emptyHand } from '@/core/helpers'
import { createRng } from '@/core/rng'
import { resolveFace, scoreHand } from '@/core/scoring'
import type { BossRuleId, CharmId, Coin, Face, HandSlot, Option, TierId } from '@/core/types'

const RUNS = 150 // full-run context: seeds per variant
const BLIND_RUNS = 200 // isolated blind cells: seeds per cell
const BUILD_RUNS = 300 // round-2 boss with-build cells: seeds per cell

// -- fast EV ---------------------------------------------------------------------

/** Per-coin P(H) given the left neighbour's face: [none, leftH, leftT].
 *  Mirrors the resolveFace odds stage (magnetic > doubleSide > chaos >
 *  weight > base; Reverse inverts). */
function faceProbs(coin: Coin): [number, number, number] {
  const fx = (k: Coin['effects'][number]['kind']) => coin.effects.find((e) => e.kind === k)
  const magnetic = fx('magnetic')
  const doubleSide = fx('doubleSide') as { kind: 'doubleSide'; favored: Face } | undefined
  const chaos = fx('chaos')
  const weight = fx('weight') as { kind: 'weight'; favored: Face } | undefined
  const reverse = fx('reverse')
  // Base P(H) when no left-dependent odds effect applies.
  let base: number
  if (doubleSide) base = doubleSide.favored === 'H' ? 1 : 0
  else if (chaos) base = 0.5
  else if (weight) base = weight.favored === 'H' ? WEIGHT_ODDS : 1 - WEIGHT_ODDS
  else base = 0.5
  const pH = magnetic ? MAGNETIC_ODDS : base // left = H
  const pT = magnetic ? 1 - MAGNETIC_ODDS : base // left = T
  // Reverse inverts the rolled face: P(H) -> 1 - P(H) for each context.
  if (reverse) return [1 - base, 1 - pH, 1 - pT]
  return [base, pH, pT]
}

/** The base chips/mult of a tier (TIERS lookup, by id). */
const TIER_BASE: Record<TierId, [number, number]> = {
  jackpot: [50, 4],
  fourRow: [40, 3],
  alternating: [35, 3],
  fourSame: [30, 2],
  tripleRun: [20, 2],
  threeSame: [15, 1],
}

/** The tier id for a face mask of length n (the matchTier logic, inlined —
 *  the tier depends only on the face pattern, not the coins). */
function tierFromMask(mask: number, n: number, boss: Option<BossRuleId>): TierId | null {
  if (n <= 2) return null
  let h = 0
  let maxRun = 1
  let run = 1
  let prev = -1
  for (let i = 0; i < n; i++) {
    const f = (mask >> i) & 1
    if (f === 1) h++
    run = f === prev ? run + 1 : 1
    if (run > maxRun) maxRun = run
    prev = f
  }
  const maxCount = Math.max(h, n - h)
  const isAlt = n === 5
  if (n === 5 && maxCount === 5) return boss.some && boss.value === 'noJackpots' ? 'fourSame' : 'jackpot'
  if (maxRun >= 4) return 'fourRow'
  if (isAlt) {
    let alt = true
    for (let i = 1; i < n; i++) if (((mask >> i) & 1) === ((mask >> (i - 1)) & 1)) alt = false
    if (alt) return boss.some && boss.value === 'noAlternating' ? null : 'alternating'
  }
  if (maxCount >= 4) return 'fourSame'
  if (maxRun >= 3) return 'tripleRun'
  if (maxCount === 3) return 'threeSame'
  return null
}

/** The chips × mult for a face mask (tier + the three scoring boosters). */
function maskTotal(mask: number, n: number, boss: Option<BossRuleId>, charms: CharmId[]): number {
  const tier = tierFromMask(mask, n, boss)
  if (!tier) return 0
  let [chips, mult] = TIER_BASE[tier]
  for (const c of charms) {
    if (c === 'plusChips') chips += PLUS_CHIPS_BONUS
    else if (c === 'plusMult') mult += PLUS_MULT_BONUS
    else if (c === 'jackpotFever' && tier === 'jackpot') chips *= JACKPOT_FEVER_MULT
  }
  return chips * mult
}

/** The expected pattern score of playing `coins` in order: the average over
 *  all 2^k face assignments (probability-weighted). */
function expectedScore(coins: Coin[], probs: [number, number, number][], boss: Option<BossRuleId>, charms: CharmId[]): number {
  const k = coins.length
  let ev = 0
  for (let mask = 0; mask < 1 << k; mask++) {
    let p = 1
    let prev = -1
    for (let i = 0; i < k; i++) {
      const f = (mask >> i) & 1
      // left context: 0 = none, 1 = left H, 2 = left T (prev is the face: 1=H, 0=T)
      const ctx = prev === -1 ? 0 : prev === 1 ? 1 : 2
      p *= f === 1 ? probs[i][ctx] : 1 - probs[i][ctx]
      prev = f
    }
    if (p === 0) continue
    ev += p * maskTotal(mask, k, boss, charms)
  }
  return ev
}

/** The expected coin cash of one coin (Tax deterministic, Jackpot 25% × $4). */
function coinCashOf(coin: Coin): number {
  let cash = 0
  for (const e of coin.effects) {
    if (e.kind === 'tax') cash += 1
    else if (e.kind === 'jackpot') cash += JACKPOT_CHANCE * JACKPOT_PAYOUT
  }
  return cash
}

/** The face-blind greedy choice: the hand subset (1–5 coins, hand order)
 *  with the highest expected score; ties → the SMALLER subset (played coins
 *  are consumed — keep-unplayed, 13a.2 — so equal-EV hands conserve the
 *  deck); always plays ≥1 coin (confirmPlay requires one). */
function bestSubset(
  coins: Coin[],
  probs: [number, number, number][],
  boss: Option<BossRuleId>,
  charms: CharmId[],
): number[] {
  const n = coins.length
  let best: number[] = []
  let bestEv = -1
  const cash = coins.map(coinCashOf)
  for (let size = 1; size <= Math.min(5, n); size++) {
    const indices: number[] = []
    const rec = (start: number) => {
      if (indices.length === size) {
        const sub = indices.map((i) => coins[i])
        const subProbs = indices.map((i) => probs[i])
        let c = 0
        for (const i of indices) c += cash[i]
        const ev = expectedScore(sub, subProbs, boss, charms) + c
        if (ev > bestEv) {
          bestEv = ev
          best = [...indices]
        }
        return
      }
      for (let i = start; i <= n - (size - indices.length); i++) {
        indices.push(i)
        rec(i + 1)
        indices.pop()
      }
    }
    rec(0)
  }
  return best
}

// -- run driver ------------------------------------------------------------------

/** Play one hand with the greedy policy (draw → best subset → score). */
function playOneHand(store: ReturnType<typeof createRunStore>): void {
  store.getState().drawHand()
  const st = store.getState()
  if (st.phase !== 'run') return // the draw auto-skipped into the shop/end
  const blind = BLINDS[st.blindIndex]
  const boss: Option<BossRuleId> = blind.kind === 'boss' ? some(blind.rule) : none
  const coins = st.hand.filter(isFilled).map((s) => s.coin)
  if (coins.length === 0) return
  const probs = coins.map(faceProbs)
  const hand = st.hand
  for (const i of bestSubset(coins, probs, boss, st.charms)) {
    // Map the subset index back to the hand index (filter order = hand order).
    let count = 0
    for (let h = 0; h < hand.length; h++) {
      if (hand[h].kind !== 'filled') continue
      if (count === i) {
        store.getState().pickCoin(h)
        break
      }
      count++
    }
  }
  store.getState().confirmPlay()
  store.getState().score()
}

/** A fresh store positioned at the start of `blindIndex` — the state
 *  leaveShop would produce (base collection + `extraCoins`, `hands` hands left,
 *  `charms` owned). */
function startAtBlind(seed: string, blindIndex: number, hands: number, extraCoins: Coin[] = [], charms: CharmId[] = []) {
  const store = createRunStore()
  store.getState().startRun(seed)
  const st = store.getState()
  store.setState({
    ...st,
    blindIndex,
    round: BLINDS[blindIndex].round,
    handsLeft: hands,
    blindScore: 0,
    earlyClearBonus: 0,
    hand: emptyHand(HAND_SIZE),
    play: emptyHand(PLAY_SIZE),
    deck: extraCoins.length > 0 ? { ...st.deck, drawPile: [...st.deck.drawPile, ...extraCoins] } : st.deck,
    charms,
    phase: 'run',
    handPhase: 'draw',
  })
  return store
}

/** Play one isolated blind to its outcome: true = cleared (shop), false = failed. */
function playBlind(store: ReturnType<typeof createRunStore>): boolean {
  let guard = 0
  while (store.getState().phase === 'run' && guard++ < 30) playOneHand(store)
  return store.getState().phase === 'shop'
}

/** The isolated clear rate of blind `blindIndex` with `hands` hands. */
function clearRate(prefix: string, blindIndex: number, hands: number, runs: number, extraCoins: Coin[] = [], charms: CharmId[] = []): number {
  let cleared = 0
  for (let r = 0; r < runs; r++) {
    if (playBlind(startAtBlind(`${prefix}-${blindIndex}-${hands}-${r}`, blindIndex, hands, extraCoins, charms))) cleared++
  }
  return cleared / runs
}

/** Play one full run (or until the run ends) with the greedy policy. */
function playRun(seed: string, charms: CharmId[]): { completed: boolean; finalCash: number } {
  const store = createRunStore()
  store.getState().startRun(seed)
  if (charms.length > 0) {
    const s = store.getState()
    store.setState({ ...s, charms, handsLeft: HANDS_PER_BLIND + 1 }) // the charm's +1 hand for the first blind
  }
  let guard = 0
  while (store.getState().phase !== 'runEnd' && guard++ < 1000) {
    const st = store.getState()
    if (st.phase === 'shop') {
      store.getState().leaveShop()
      continue
    }
    playOneHand(store)
  }
  const end = store.getState()
  return { completed: end.won, finalCash: end.cash }
}

/** A filled play from a face mask (for the cross-checks below). */
function maskPlay(mask: number, n: number) {
  return Array.from({ length: n }, (_, i) => ({
    kind: 'filled' as const,
    coin: { id: i, effects: [] },
    face: (((mask >> i) & 1) === 1 ? 'H' : 'T') as 'H' | 'T',
    echoUsed: false,
  }))
}

describe('13a.11 — EV math cross-checks (the sim must match the real pipeline)', () => {
  it('maskTotal === scoreHand.total for every face pattern, boss rule and charm set', () => {
    const bosses: Option<BossRuleId>[] = [none, some('noAlternating'), some('noJackpots'), some('shortFuse'), some('heavyTarget')]
    const charmSets: CharmId[][] = [[], ['plusChips'], ['plusMult'], ['jackpotFever'], ['plusChips', 'plusMult', 'jackpotFever']]
    const neverRng = { next: () => 1, state: () => [0, 0, 0, 0], restore: () => {} }
    let checked = 0
    for (const n of [1, 2, 3, 4, 5]) {
      for (let mask = 0; mask < 1 << n; mask++) {
        for (const boss of bosses) {
          for (const charms of charmSets) {
            const s = scoreHand(maskPlay(mask, n), boss, charms, neverRng)
            expect(maskTotal(mask, n, boss, charms)).toBe(s.kind === 'scored' ? s.total : 0)
            checked++
          }
        }
      }
    }
    expect(checked).toBe(1550) // (2+4+8+16+32) patterns × 5 bosses × 5 charm sets
  })

  it('faceProbs matches the resolveFace distribution (Monte Carlo, seeded)', () => {
    const coins: Coin[] = [
      { id: 1, effects: [] },
      { id: 2, effects: [{ kind: 'weight', favored: 'H' }] },
      { id: 3, effects: [{ kind: 'weight', favored: 'T' }] },
      { id: 4, effects: [{ kind: 'doubleSide', favored: 'H' }] },
      { id: 5, effects: [{ kind: 'magnetic' }] },
      { id: 6, effects: [{ kind: 'reverse' }] },
      { id: 7, effects: [{ kind: 'reverse' }, { kind: 'weight', favored: 'H' }] },
      { id: 8, effects: [{ kind: 'magnetic' }, { kind: 'doubleSide', favored: 'T' }] }, // magnetic wins (left present)
      { id: 9, effects: [{ kind: 'chaos' }] },
    ]
    const N = 20000
    for (const coin of coins) {
      const table = faceProbs(coin)
      for (let ctx = 0; ctx < 3; ctx++) {
        const left = ctx === 0 ? none : ctx === 1 ? some<Face>('H') : some<Face>('T')
        const rng = createRng(`mc-${coin.id}-${ctx}`)
        let h = 0
        for (let i = 0; i < N; i++) if (resolveFace(rng, coin, left) === 'H') h++
        const empirical = h / N
        const expected = table[ctx]
        expect(Math.abs(empirical - expected)).toBeLessThan(0.01) // 3σ at N=20000 ≈ 0.004
      }
    }
  })

  it('expectedScore matches Monte-Carlo rolls of the real pipeline (mixed effects incl. magnetic)', () => {
    // The strongest guarantee the sim matches the engine: the analytic EV
    // (faceProbs × maskTotal) vs. the average of real resolveFace + scoreHand
    // rolls over the same hand. Catches any context/odds/tier divergence.
    const hand: Coin[] = [
      { id: 1, effects: [] },
      { id: 2, effects: [{ kind: 'weight', favored: 'H' }] },
      { id: 3, effects: [{ kind: 'magnetic' }] },
      { id: 4, effects: [{ kind: 'doubleSide', favored: 'T' }] },
      { id: 5, effects: [{ kind: 'reverse' }, { kind: 'weight', favored: 'T' }] },
    ]
    const probs = hand.map(faceProbs)
    const analytic = expectedScore(hand, probs, none, []) + hand.reduce((c, coin) => c + coinCashOf(coin), 0)
    const rng = createRng('ev-mc-13a11')
    const N = 20000
    let total = 0
    for (let i = 0; i < N; i++) {
      const play: HandSlot[] = []
      for (let j = 0; j < hand.length; j++) {
        let prevFace: Option<Face> = none
        if (j > 0) {
          const p = play[j - 1]
          if (p.kind === 'filled') prevFace = some<Face>(p.face)
        }
        const face = resolveFace(rng, hand[j], prevFace)
        play.push({ kind: 'filled', coin: hand[j], face, echoUsed: false })
      }
      const s = scoreHand(play, none, [], rng)
      total += (s.kind === 'scored' ? s.total : 0) + s.cash
    }
    const empirical = total / N
    // σ of the mean ≈ (per-roll σ)/√N; per-roll scores are ≤ ~240, so 3σ ≲ 2.
    expect(Math.abs(analytic - empirical)).toBeLessThan(3)
  })
})

describe('13a.11 — playtest: hand-economy on the 4-hand blind', () => {
  it(`per-blind clear rates: base hands vs +1 hand (${BLIND_RUNS} runs per cell)`, () => {
    const rows: string[] = []
    const baseRates: number[] = []
    const plusRates: number[] = []
    for (let b = 0; b < BLINDS.length; b++) {
      const blind = BLINDS[b]
      const baseHands = blind.kind === 'boss' && blind.rule === 'shortFuse' ? SHORT_FUSE_HANDS : HANDS_PER_BLIND
      const base = clearRate('pt11', b, baseHands, BLIND_RUNS)
      const plus = clearRate('pt11', b, baseHands + 1, BLIND_RUNS)
      baseRates.push(base)
      plusRates.push(plus)
      const label = `${blind.round}${blind.kind === 'boss' ? `B(${blind.rule})` : blind.kind[0]}`
      const target = blind.target
      rows.push(
        `${label.padEnd(14)} target ${String(target).padStart(4)} | ${baseHands}h ${(base * 100).toFixed(1).padStart(5)}% | ${baseHands + 1}h ${(plus * 100).toFixed(1).padStart(5)}% | Δ ${(plus - base >= 0 ? '+' : '')}${((plus - base) * 100).toFixed(1)}pp`,
      )
    }
    console.log('\n=== 13a.11 playtest — isolated blind clear rates (face-blind greedy, base 24-coin collection, no discards, no buys) ===')
    console.log(rows.join('\n'))
    console.log('')
    const r2boss = 5 // the round-2 boss (Short Fuse)
    console.log(`round-2 boss (Short Fuse, target 750): ${SHORT_FUSE_HANDS}h ${(baseRates[r2boss] * 100).toFixed(1)}% → 4h ${(plusRates[r2boss] * 100).toFixed(1)}%`)
    console.log('')
    // Sanity: an extra hand can never lower a clear rate (same policy, more tries).
    for (let b = 0; b < BLINDS.length; b++) expect(plusRates[b]).toBeGreaterThanOrEqual(baseRates[b] - 0.02) // 2pp noise floor
  }, 240_000)

  it(`full-run completion (context: base game, no shop buys), ${RUNS} runs per variant`, () => {
    const run = (prefix: string, charms: CharmId[]) => {
      let completed = 0
      let cash = 0
      for (let r = 0; r < RUNS; r++) {
        const res = playRun(`${prefix}-${r}`, charms)
        completed += res.completed ? 1 : 0
        cash += res.finalCash
      }
      return { completion: completed / RUNS, avgCash: cash / RUNS }
    }
    const base = run('m13a11-base', [])
    const extra = run('m13a11-extra', ['extraHand'])
    console.log(`full run (no buys): base completion ${(base.completion * 100).toFixed(1)}% (avg $${base.avgCash.toFixed(1)}) | extraHand completion ${(extra.completion * 100).toFixed(1)}% (avg $${extra.avgCash.toFixed(1)})`)
    console.log('')
    expect(extra.completion).toBeGreaterThanOrEqual(base.completion)
  }, 240_000)

  it('round-2 boss (Short Fuse, 750): the 3-hand cut and the max-score wall', () => {
    // Base collection: the boss is a wall at both 3 and 4 hands.
    const b3 = clearRate('pt11-boss', 5, SHORT_FUSE_HANDS, BUILD_RUNS)
    const b4 = clearRate('pt11-boss', 5, SHORT_FUSE_HANDS + 1, BUILD_RUNS)
    console.log(`round-2 boss (750), base collection: ${SHORT_FUSE_HANDS}h ${(b3 * 100).toFixed(1)}% → ${SHORT_FUSE_HANDS + 1}h ${(b4 * 100).toFixed(1)}%`)

    // The wall is structural: the max tier is Jackpot (50×4 = 200), so
    // 3 hands can score at most 600 < 750 (unclearable without boosters),
    // while 4 hands can reach 800 > 750. The Short Fuse 4→3 cut therefore
    // removes the only no-booster path to the round-2 boss.
    const MAX_TIER = 200 // jackpot: 50 chips × 4 mult
    expect(SHORT_FUSE_HANDS * MAX_TIER).toBeLessThan(BLINDS[5].target) // 600 < 750
    expect((SHORT_FUSE_HANDS + 1) * MAX_TIER).toBeGreaterThan(BLINDS[5].target) // 800 > 750

    // But it is a jackpot-GATE, not impossible: with the Jackpot-Fever
    // booster (jackpot chips ×2 → 400/hand) and a small build, 3 hands can
    // clear (two jackpots = 800 ≥ 750). Confirm the rate is non-zero.
    const build: Coin[] = Array.from({ length: 4 }, (_, i) => ({ id: 100 + i, effects: [{ kind: 'weight', favored: 'H' as const }] }))
    const fever3 = clearRate('pt11-fever', 5, SHORT_FUSE_HANDS, BUILD_RUNS, build, ['jackpotFever'])
    console.log(`round-2 boss (750), ${SHORT_FUSE_HANDS}h with Jackpot-Fever + 4 Weight-H: ${(fever3 * 100).toFixed(1)}%`)
    console.log('')
    expect(fever3).toBeGreaterThan(0)
  }, 240_000)
})
