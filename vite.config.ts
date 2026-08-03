/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// base '/' is correct for a user site served from the domain root.
// A project site would need '/<repo-name>/'.
export default defineConfig({
  base: '/',
  plugins: [react()],
  test: {
    // Everything under test is pure logic; the shell UI is verified in a browser.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
