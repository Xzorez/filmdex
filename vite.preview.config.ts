import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// Solo para ver el interfaz en el navegador con datos de mentira.
export default defineConfig({
  root: resolve(__dirname, 'preview'),
  plugins: [react()],
  server: { port: 5199, open: false }
})
