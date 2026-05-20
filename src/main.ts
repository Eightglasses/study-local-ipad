import { createSSRApp } from 'vue'
import App from './App.vue'

// 注册 Service Worker（PWA 离线缓存）
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

export function createApp() {
  const app = createSSRApp(App)
  return { app }
}
