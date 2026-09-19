// Folder structure check (the project's file-layout rule):
//   - at most 5 ts/tsx source files per folder (test files excluded)
//   - at most 3 css files per folder
// Run via `npm run check:structure` (also chained into `npm run lint`).

import { readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git', '.qwen'])
const MAX_TS = 5
const MAX_CSS = 3
// Exception: the config registries (src/config/coins, src/config/charms) hold
// ONE FILE PER COIN / CHARM — the per-item file layout is the point (adding a
// coin = one new file + one registry line), so they may exceed MAX_TS.
const CONFIG_MAX_TS = 15
const isTest = (f) => /\.test\.(ts|tsx)$/.test(f)

let bad = 0
walk(root, true)

function walk(dir, isDir) {
  if (!isDir) return
  const files = readdirSync(dir)
  const ts = files.filter((f) => /\.(ts|tsx)$/.test(f) && !isTest(f)).length
  const css = files.filter((f) => f.endsWith('.css')).length
  const rel = relative(root, dir)
  const maxTs = rel.split(/[\\/]/).includes('config') ? CONFIG_MAX_TS : MAX_TS
  if (ts > maxTs || css > MAX_CSS) {
    bad++
    console.error(`✗ ${rel || '.'}: ${ts} ts/tsx (max ${maxTs}), ${css} css (max ${MAX_CSS})`)
  }
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) walk(join(dir, entry.name), true)
  }
}

if (bad > 0) {
  console.error(`\n${bad} folder(s) violate the structure rule`)
  process.exit(1)
}
console.log('structure ok')
