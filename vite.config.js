import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const srcRoot = resolve(rootDir, 'src')

export default defineConfig({
  root: srcRoot,
  envDir: rootDir,
  publicDir: resolve(rootDir, 'public'),
  plugins: [react(), tailwindcss()],
  build: {
    outDir: resolve(rootDir, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(srcRoot, 'index.html'),
      },
    },
  },
  server: {
    allowedHosts: true,
  },
})
