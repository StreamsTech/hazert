import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    sourcemap: true, // Enable for production builds
  },
  css: {
    devSourcemap: true, // Enable CSS source maps in dev
  },
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart({ customViteReactPlugin: true }),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    react(),
  ],
})
