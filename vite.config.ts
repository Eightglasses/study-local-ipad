import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['songzy.site'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
