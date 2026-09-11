import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: '../../public',
  server: { 
    port: 5174,
    proxy: { '/functions': 'http://127.0.0.1:54321' } 
  },
})
