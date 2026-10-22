import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // caminhos relativos: funciona em qualquer subpasta (GitHub Pages, Vercel, etc.)
  base: './',
  plugins: [react(), tailwindcss()],
})
