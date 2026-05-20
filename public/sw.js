// Service Worker - 离线缓存
const CACHE_NAME = "checkin-app-v1";

// 需要预缓存的核心文件
const PRECACHE_URLS = ["/", "/index.html"];

// 安装：预缓存核心文件
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }),
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// 请求：优先网络，网络失败时回退缓存
self.addEventListener("fetch", (event) => {
  // 跳过非 GET 请求和 API 请求
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 缓存成功的响应
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, cloned);
        });
        return response;
      })
      .catch(() => {
        // 网络失败时回退缓存
        return caches.match(event.request);
      }),
  );
});
