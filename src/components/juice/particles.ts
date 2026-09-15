// Particles + confetti (13.5) — a lightweight canvas particle layer
// (SDD UX §7). Chip bursts (6–12 per hit), coin sparkles (~4 on land),
// cash bursts on payout, and confetti (200–300 pieces) on blind clear.
// Colors come from the active tier / theme tokens.
//
// Purely presentational (UX §0): it reads nothing from the store except the
// blind-clear transition (a phase change to observe), never mutates state,
// and never blocks input (pointer-events: none, its own rAF loop that runs
// only while particles are alive, DPR cap 2 — UX §9).
//
// Reduced motion (UX §8): minimal — counts scaled down, lifetimes shortened.

import type { TierId } from '@/core/types'

/** One live particle (canvas-space px, pre-DPR). */
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  ttl: number
  size: number
  color: string
  gravity: number
  /** 'dot' (bursts/sparkles) or 'rect' (confetti). */
  shape: 'dot' | 'rect'
  rot: number
  vrot: number
}

let particles: Particle[] = []
let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let dpr = 1
let rafId: number | null = null
let lastT: number | null = null

/** Reduced motion (UX §8): minimal particles (shorter, fewer). */
function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Hex fallbacks for the theme tokens (jsdom / no stylesheet). */
const TOKEN_HEX: Record<string, string> = {
  '--tier-jackpot': '#e8b04b',
  '--tier-four-row': '#8b6fc7',
  '--tier-alternating': '#2fa79b',
  '--tier-four-same': '#4a82c4',
  '--tier-triple-run': '#5aa469',
  '--tier-three-same': '#9a9086',
  '--heads': '#e8b04b',
  '--tails': '#6c8cb5',
  '--primary': '#f0654a',
}

/** Resolve a CSS var (or plain color) to a concrete color for the canvas. */
export function resolveColor(color: string): string {
  if (!color.startsWith('var(')) return color
  const name = color.slice(4, -1).trim()
  const live = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return live || TOKEN_HEX[name] || '#f0654a'
}

/** The active tier's color (UX §7: colors from the tier tokens). */
export function tierColor(tier: TierId): string {
  return resolveColor(`var(--tier-${tier === 'fourRow' ? 'four-row' : tier === 'threeSame' ? 'three-same' : tier === 'fourSame' ? 'four-same' : tier === 'tripleRun' ? 'triple-run' : tier})`)
}

/** The theme palette for confetti (tier tokens + primary). */
const CONFETTI_COLORS = [
  '--tier-jackpot',
  '--tier-four-row',
  '--tier-alternating',
  '--tier-four-same',
  '--tier-triple-run',
  '--primary',
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function scaleForReduced(count: number, ttl: number): { count: number; ttl: number } {
  return reducedMotion() ? { count: Math.max(2, Math.ceil(count * 0.3)), ttl: ttl * 0.6 } : { count, ttl }
}

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
  step(dt / 1000)
  draw()
  if (particles.length > 0) rafId = requestAnimationFrame(loop)
  else lastT = null
}

function step(dt: number): void {
  for (const p of particles) {
    p.age += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += p.gravity * dt
    p.rot += p.vrot * dt
  }
  particles = particles.filter((p) => p.age < p.ttl)
}

function draw(): void {
  if (!ctx) return
  ctx.clearRect(0, 0, canvas!.width, canvas!.height)
  for (const p of particles) {
    const fade = 1 - p.age / p.ttl
    ctx.globalAlpha = Math.max(0, fade)
    ctx.fillStyle = p.color
    if (p.shape === 'dot') {
      ctx.beginPath()
      ctx.arc(p.x * dpr, p.y * dpr, p.size * dpr, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.save()
      ctx.translate(p.x * dpr, p.y * dpr)
      ctx.rotate(p.rot)
      ctx.fillRect((-p.size / 2) * dpr, (-p.size / 2) * dpr, p.size * dpr, p.size * 0.6 * dpr)
      ctx.restore()
    }
  }
  ctx.globalAlpha = 1
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
  const colors = CONFETTI_COLORS.map(resolveColor)
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

