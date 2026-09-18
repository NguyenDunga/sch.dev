// 13.5 — particle physics + canvas drawing (SDD UX §7). Pure functions over
// the particle list — the loop/state lives in particles.ts.

/** One live particle (canvas-space px, pre-DPR). */
export interface Particle {
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

/** Advance every particle by dt seconds; drop the dead ones. */
export function step(particles: Particle[], dt: number): Particle[] {
  for (const p of particles) {
    p.age += dt
    p.x += p.vx * dt
    p.y += p.vy * dt
    p.vy += p.gravity * dt
    p.rot += p.vrot * dt
  }
  return particles.filter((p) => p.age < p.ttl)
}

/** Draw every particle (fade out over its lifetime; DPR-scaled). */
export function draw(
  ctx: CanvasRenderingContext2D,
  dpr: number,
  width: number,
  height: number,
  particles: Particle[],
): void {
  ctx.clearRect(0, 0, width, height)
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
