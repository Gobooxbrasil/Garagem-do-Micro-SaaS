import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: ['qrcode'],
      output: {
        paths: {
          qrcode: 'https://esm.sh/qrcode@1.5.3'
        }
      }
    }
  }
})