// M14.5 — Guard: no Math.random() in src/core/ or src/state/.
//
// The game is fully deterministic: all randomness flows through the seeded
// RNG (src/core/rng.ts). This test greps the source tree at test time and
// fails if any file in core/ or state/ calls Math.random().

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Recursively collect all .ts/.tsx files under a directory. */
function collectFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) {
      results.push(...collectFiles(full))
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) {
      results.push(full)
    }
  }
  return results
}

describe('M14.5 — No Math.random() in core/ or state/', () => {
  const root = resolve(__dirname, '..')
  const dirs = ['core', 'state']

  for (const dir of dirs) {
    it(`no Math.random() in src/${dir}/`, () => {
      const files = collectFiles(join(root, dir))
      const offenders: string[] = []
      for (const file of files) {
        const content = readFileSync(file, 'utf-8')
        // Match Math.random( as a function call (not in a comment)
        const lines = content.split('\n')
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comment-only lines
          if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue
          if (/Math\.random\s*\(/.test(line)) {
            offenders.push(`${dir}/${file.split(root)[1].replace(/\\/g, '/')}:${i + 1}`)
          }
        }
      }
      expect(offenders, `Math.random() found in:\n${offenders.join('\n')}`).toEqual([])
    })
  }
})
