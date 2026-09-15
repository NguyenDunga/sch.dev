// Generates the CC0 SFX assets in public/resource/sfx/ (WBS M13.7, UX §10).
//
// Every file is a short synthesized mono 16-bit PCM .wav (22.05kHz) —
// generated, hence CC0, no external assets. Re-run after editing:
//   node scripts/generate-sfx.mjs
//
// Design (UX §10): small events quiet + short; tier hits and the
// blind-clear stinger loud so the escalation reads in audio too. No music.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SR = 22050
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'resource', 'sfx')

/** Write a 16-bit PCM mono WAV. */
function wav(file, samples) {
  const n = samples.length
  const buf = Buffer.alloc(44 + n * 2)
  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + n * 2, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20) // PCM
  buf.writeUInt16LE(1, 22) // mono
  buf.writeUInt32LE(SR, 24)
  buf.writeUInt32LE(SR * 2, 28)
  buf.writeUInt16LE(2, 32)
  buf.writeUInt16LE(16, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(n * 2, 40)
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2)
  }
  writeFileSync(join(OUT, file), buf)
}

const dur = (ms) => Math.floor((SR * ms) / 1000)
const env = (i, n, a = 0.01, r = 0.3) => {
  // attack/release envelope (linear)
  const at = Math.floor(n * a)
  const rt = Math.floor(n * r)
  if (i < at) return i / at
  if (i > n - rt) return Math.max(0, (n - i) / rt)
  return 1
}
const sine = (f, t) => Math.sin(2 * Math.PI * f * t)
const noise = () => Math.random() * 2 - 1
/** One-pole low-pass (in place). */
function lowpass(samples, coeff) {
  let y = 0
  for (let i = 0; i < samples.length; i++) {
    y = samples[i] * (1 - coeff) + y * coeff
    samples[i] = y
  }
  return samples
}
function out(ms, fn) {
  const n = dur(ms)
  const s = new Array(n)
  for (let i = 0; i < n; i++) s[i] = fn(i / n, i / SR) * env(i, n)
  return s
}

mkdirSync(OUT, { recursive: true })

// draw/deal — a soft short whoosh (per hand).
wav('deal.wav', lowpass(out(120, (p, t) => noise() * (0.5 + 0.5 * p)), 0.06).map((v) => v * 0.5))
// pick / unpick — short clicks (a touch lower for unpick).
wav('pick.wav', out(50, (p, t) => sine(700, t) * (1 - p)))
wav('unpick.wav', out(50, (p, t) => sine(500, t) * (1 - p)))
// discard — the "shhk" (a band-ish noise burst).
wav('discard.wav', lowpass(out(140, (p) => noise() * (1 - p * p)), 0.25).map((v) => v * 0.7))
// coin toss — a rising whoosh.
wav('toss.wav', lowpass(out(180, (p, t) => noise() * 0.6 + sine(300 + 500 * p, t) * 0.3), 0.1).map((v) => v * 0.8))
// land — a low thud.
wav('land.wav', out(120, (p, t) => (sine(90, t) * 0.8 + noise() * 0.2) * (1 - p) ** 2).map((v) => v * 0.9))
// tier hit — a bright two-tone chime (pitch/variant by tier rank via rate).
wav('tierHit.wav', out(250, (p, t) => (sine(880, t) + sine(1318, t) * 0.6) * (1 - p) ** 1.5).map((v) => v * 0.9))
// chip tick — a short high tick (rate rises with the tick index).
wav('chip.wav', out(60, (p, t) => sine(1200, t) * (1 - p)).map((v) => v * 0.6))
// mult flare — a rising sweep.
wav('mult.wav', out(160, (p, t) => sine(400 + 500 * p, t) * (1 - p * 0.5)).map((v) => v * 0.8))
// cash — a coin clink.
wav('cash.wav', out(100, (p, t) => (sine(2200, t) + sine(2637, t) * 0.5) * (1 - p) ** 2).map((v) => v * 0.7))
// button — a tactile click.
wav('button.wav', out(40, (p, t) => sine(900, t) * (1 - p)).map((v) => v * 0.5))
// reroll — two quick clicks.
wav('reroll.wav', out(100, (p, t) => (p < 0.5 ? sine(800, t) : sine(600, t - 0.05)) * (1 - (p % 0.5) * 2)).map((v) => v * 0.6))
// buy — a clink + click.
wav('buy.wav', out(150, (p, t) => (p < 0.6 ? sine(2000, t) * (1 - p) : sine(900, t - 0.09)) * 0.8).map((v) => v * 0.7))
// invalid — a low buzz.
wav('error.wav', out(130, (p, t) => (Math.sign(sine(160, t)) * 0.7 + sine(320, t) * 0.3) * (1 - p)).map((v) => v * 0.6))
// blind clear — a rising stinger (no music: a short fanfare arpeggio).
wav('winStinger.wav', out(700, (p, t) => {
  const step = Math.min(3, Math.floor(p * 4))
  const f = [523, 659, 784, 1047][step]
  const lp = (p * 4 - step) * 0.5
  return (sine(f, t) + sine(f * 2, t) * 0.3) * (0.5 + 0.5 * lp)
}).map((v) => v * 0.9))
// game over — a falling stinger.
wav('loseStinger.wav', out(700, (p, t) => {
  const step = Math.min(2, Math.floor(p * 3))
  const f = [392, 311, 262][step]
  return (sine(f, t) + sine(f / 2, t) * 0.4) * (1 - p * 0.5)
}).map((v) => v * 0.8))

console.log(`wrote ${16} sfx files to ${OUT}`)
