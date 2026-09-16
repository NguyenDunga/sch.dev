// M17c — CSS validation: all component CSS must reference design tokens,
// not raw values. This test scans every .css file in src/ and asserts:
//
// 1. No raw hex colors outside tokens.css (use var(--color) instead)
// 2. No raw spacing values (margin/padding/gap) outside tokens.css (use var(--sp-*) or rem)
// 3. No raw font-size values outside tokens.css (use var(--text-*) or rem)
//
// Exceptions (allowed):
// - tokens.css (defines the values)
// - border-width, outline-width, box-shadow offsets (structural, not spacing)
// - 0, 1px, 2px, 3px, 4px (border/outline widths)
// - 44px (accessibility hit target)
// - 9999px (border-radius: full)
// - translate micro-offsets (1px, 2px, 3px)
// - percentage values, calc(), color-mix()

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = join(__dirname, '..', '..')

function collectCssFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') continue
      results.push(...collectCssFiles(full))
    } else if (entry.endsWith('.css')) {
      results.push(full)
    }
  }
  return results
}

/** Strip CSS comments. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Get all declarations (property: value) from a CSS string. */
function getDeclarations(css: string): { prop: string; value: string }[] {
  const decls: { prop: string; value: string }[] = []
  // Match property: value; inside braces
  const re = /([a-z-]+)\s*:\s*([^;{}]+);/g
  let m: RegExpExecArray | null
  while ((m = re.exec(css)) !== null) {
    decls.push({ prop: m[1], value: m[2].trim() })
  }
  return decls
}

describe('M17c — CSS token validation', () => {
  const cssFiles = collectCssFiles(join(ROOT, 'src')).filter(
    (f) => !f.includes('node_modules'),
  )

  it('finds CSS files to validate', () => {
    expect(cssFiles.length).toBeGreaterThan(0)
    const rel = cssFiles.map((f) => relative(ROOT, f))
    console.log(`  Validating ${cssFiles.length} CSS files: ${rel.join(', ')}`)
  })

  // ── 1. No raw hex colors outside tokens.css ──────────────────────────────
  it('no raw hex colors outside tokens.css', () => {
    const violations: string[] = []
    for (const file of cssFiles) {
      const rel = relative(ROOT, file)
      if (rel.includes('tokens.css')) continue
      const css = stripComments(readFileSync(file, 'utf8'))
      const hexRe = /#[0-9a-fA-F]{3,8}\b/g
      let m: RegExpExecArray | null
      while ((m = hexRe.exec(css)) !== null) {
        const line = css.slice(0, m.index).split('\n').length
        violations.push(`${rel}:${line} → ${m[0]}`)
      }
    }
    expect(violations, `Raw hex colors found:\n${violations.join('\n')}`).toEqual([])
  })

  // ── 2. No raw spacing (margin/padding/gap) with px outside tokens.css ────
  it('no raw px spacing (margin/padding/gap) outside tokens.css', () => {
    const spacingProps = new Set([
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'gap', 'row-gap', 'column-gap',
    ])
    // Allowed px values for spacing: 0, -1px (sr-only idiom)
    const allowedPx = new Set(['0', '0px', '-1px'])

    const violations: string[] = []
    for (const file of cssFiles) {
      const rel = relative(ROOT, file)
      if (rel.includes('tokens.css')) continue
      const css = stripComments(readFileSync(file, 'utf8'))
      const decls = getDeclarations(css)
      for (const { prop, value } of decls) {
        if (!spacingProps.has(prop)) continue
        // Skip values that use var(), calc(), rem, em, %, auto, inherit
        if (value.includes('var(') || value.includes('calc(') || value.includes('rem') ||
            value.includes('em') || value.includes('%') || value === 'auto' ||
            value === 'inherit' || value === 'initial' || value === 'unset') continue
        // Check for raw px
        const pxMatch = value.match(/-?\d+\.?\d*px/g)
        if (pxMatch) {
          for (const px of pxMatch) {
            if (!allowedPx.has(px)) {
              violations.push(`${rel} → ${prop}: ${value} (use var(--sp-*) or rem)`)
              break
            }
          }
        }
      }
    }
    expect(violations, `Raw px spacing found:\n${violations.join('\n')}`).toEqual([])
  })

  // ── 3. No raw font-size with px outside tokens.css ───────────────────────
  it('no raw px font-size outside tokens.css', () => {
    const violations: string[] = []
    for (const file of cssFiles) {
      const rel = relative(ROOT, file)
      if (rel.includes('tokens.css')) continue
      const css = stripComments(readFileSync(file, 'utf8'))
      const decls = getDeclarations(css)
      for (const { prop, value } of decls) {
        if (prop !== 'font-size') continue
        // Allow rem, em, %, var(), calc(), inherit, initial
        if (value.includes('var(') || value.includes('calc(') || value.includes('rem') ||
            value.includes('em') || value.includes('%') || value === 'inherit' ||
            value === 'initial') continue
        // Flag raw px
        if (value.match(/\d+\.?\d*px/)) {
          violations.push(`${rel} → font-size: ${value} (use var(--text-*) or rem)`)
        }
      }
    }
    expect(violations, `Raw px font-size found:\n${violations.join('\n')}`).toEqual([])
  })

  // ── 4. All src/style/ files use tokens for colors (var(--...)) ───────────
  it('src/style/ files reference color tokens (no raw color names)', () => {
    const rawColorNames = new Set([
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink',
      'white', 'black', 'gray', 'grey', 'brown', 'navy', 'teal',
    ])
    const violations: string[] = []
    const styleDir = join(ROOT, 'src', 'style')
    for (const file of cssFiles.filter((f) => f.startsWith(styleDir))) {
      const rel = relative(ROOT, file)
      if (rel.includes('tokens.css')) continue
      const css = stripComments(readFileSync(file, 'utf8'))
      const decls = getDeclarations(css)
      for (const { prop, value } of decls) {
        if (!prop.includes('color') && prop !== 'background' && prop !== 'border' &&
            !prop.includes('border') && prop !== 'outline' && prop !== 'box-shadow') continue
        for (const name of rawColorNames) {
          if (value.toLowerCase().includes(name) && !value.includes('var(')) {
            violations.push(`${rel} → ${prop}: ${value} (use var(--color-token))`)
            break
          }
        }
      }
    }
    expect(violations, `Raw color names found:\n${violations.join('\n')}`).toEqual([])
  })
})
