import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: '../../public',
  resolve: {
    alias: {
      '@ymenet/theme': path.resolve(__dirname, '../../packages/theme/index.ts'),
    },
  },
  server: { 
    port: 5173,
    proxy: { '/functions': 'http://127.0.0.1:54321' } 
  },
})
