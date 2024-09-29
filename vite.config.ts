/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { OpenInEditor } from './vendor/vite-plugin-open-in-editor.ts'
import ViteUsing from './vendor/vite-plugin-using.ts'

// https://vitejs.dev/config/
export default defineConfig({
  clearScreen: false,
  test: {
    globals: true,
    includeSource: ['src/**/*.{js,jsx,ts,tsx}'],
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  esbuild: {
    jsx: 'automatic',
    target: 'esnext',
  },
  plugins: [
    ViteUsing(),
    OpenInEditor(),
  ]
})
