// Particles + confetti (13.5) — a lightweight canvas particle layer
// (SDD UX §7). Chip bursts (6–12 per hit), coin sparkles (~4 on land),
// cash bursts on payout, and confetti (200–300 pieces) on blind clear.
//
// Purely presentational (UX §0): it reads nothing from the store except the
// blind-clear transition (a phase change to observe), never mutates state,
// and never blocks input (pointer-events: none, its own rAF loop that runs
// only while particles are alive, DPR cap 2 — UX §9).
//
// Split (150-LOC file rule): particle-colors.ts (token → color resolution),
// particle-draw.ts (physics + canvas drawing), this file (loop + emitters).

import { confettiColors, rand, resolveColor, scaleForReduced } from './particle-colors'
import { draw, step, type Particle } from './particle-draw'

// Colors (token → canvas) live in particle-colors.ts (150-LOC file rule).
export { resolveColor, tierColor } from './particle-colors'

let particles: Particle[] = []
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let dpr = 1
let rafId: number | null = null
let lastT: number | null = null

function startLoop(): void {
  if (rafId !== null) return
  lastT = null
  rafId = requestAnimationFrame(loop)
}

/** Step + draw one frame; the loop runs only while particles are alive
 *  (UX §9 — no idle rAF cost). */
function loop(t: number): void {
  rafId = null
  const dt = lastT === null ? 16 : Math.min(50, t - lastT)
  lastT = t
  particles = step(particles, dt / 1000)
  if (ctx && canvas) draw(ctx, dpr, canvas.width, canvas.height, particles)
  if (particles.length > 0) rafId = requestAnimationFrame(loop)
  else lastT = null
}

/** A radial burst (chip burst 6–12 per hit, coin sparkle ~4, UX §7). */
export function emitBurst(opts: { x: number; y: number; color: string; count?: number; speed?: number }): void {
  const { x, y, color } = opts
  const count = opts.count ?? 9
  const speed = opts.speed ?? 1
  const { count: n, ttl } = scaleForReduced(count, 0.55)
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2)
    const v = rand(60, 160) * speed
    particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      age: 0,
      ttl: rand(ttl * 0.6, ttl),
      size: rand(2, 4.5),
      color: resolveColor(color),
      gravity: 260,
      shape: 'dot',
      rot: 0,
      vrot: 0,
    })
  }
  startLoop()
}

/** Confetti on blind clear (200–300 pieces, UX §7): falls from the top. */
export function emitConfetti(opts?: { count?: number }): void {
  const count = opts?.count ?? 240
  const { count: n, ttl } = scaleForReduced(count, 2.2)
  const w = window.innerWidth
  const colors = confettiColors()
  for (let i = 0; i < n; i++) {
    particles.push({
      x: rand(w * 0.15, w * 0.85),
      y: rand(-40, 10),
      vx: rand(-40, 40),
      vy: rand(60, 180),
      age: 0,
      ttl: rand(ttl * 0.5, ttl),
      size: rand(5, 9),
      color: colors[i % colors.length],
      gravity: 220,
      shape: 'rect',
      rot: rand(0, Math.PI),
      vrot: rand(-6, 6),
    })
  }
  startLoop()
}

/** The live particle count (test hook). */
export function activeParticleCount(): number {
  return particles.length
}

/** Size the canvas (DPR cap 2, UX §9) and grab its context. */
export function attachLayer(c: HTMLCanvasElement | null): void {
  canvas = c
  if (!c) return
  dpr = Math.min(2, window.devicePixelRatio || 1)
  c.width = Math.floor(window.innerWidth * dpr)
  c.height = Math.floor(window.innerHeight * dpr)
  ctx = c.getContext('2d')
}

/** Stop the loop and drop all particles (unmount, UX §9). */
export function disposeParticles(): void {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
  lastT = null
  particles = []
  if (ctx) ctx.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0)
}
