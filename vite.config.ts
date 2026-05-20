import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// 为带内容哈希的静态资源添加长期缓存（图片/字体/媒体/Vite预打包依赖）
function staticAssetCache(): any {
  return {
    name: 'static-asset-cache',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url: string = req.url || ''
        // 1. 图片、字体、媒体等不常变动的静态资源
        // 2. Vite 预打包依赖（node_modules/.vite/deps/），文件名自带内容哈希，内容不变则 URL 不变
        if (
          /\.(png|jpe?g|gif|svg|ico|webp|woff2?|ttf|otf|eot|mp4|webm|mp3|wav)$/i.test(url) ||
          /node_modules\/\.vite\/deps\/.*\.(js|mjs|css)$/i.test(url)
        ) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [uni(), staticAssetCache()],
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    port: 8080,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',').filter(Boolean) || [],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
