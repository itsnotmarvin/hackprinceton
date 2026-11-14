import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // allow importing ../mocks (repo root) while in mock mode
  server: { port: 5173, fs: { allow: ['..'] } },
})
