import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // Necesitarás instalar @types/node si usas TS, o simplemente usarlo en JS

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Esto te permite usar '@' para referirte a la carpeta 'src'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Útil si quieres previsualizar en otros dispositivos de tu red local
    host: true,
    port: 3000, 
  },
  build: {
    // Optimización para despliegues en Vercel o Cloudflare
    outDir: 'dist',
    sourcemap: false,
  }
})
