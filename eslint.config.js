import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui copy-in components export cva variants alongside components
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // NASA practice: no function longer than 60 lines.
    // Excluded: test files (describe blocks) and the dev-only debug page.
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', 'src/pages/debug.tsx'],
    rules: {
      'max-lines-per-function': ['error', { max: 60 }],
    },
  },
])
