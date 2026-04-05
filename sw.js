const CACHE_NAME = "agri-v20";

const assets = [
  "./",
  "./index.html",
  "./manifest.json",
  "./css/styles.css",

  "./js/database.js",
  "./js/calculator.js",
  "./js/ui.js",
  "./js/app.js",

  "./vendor/fontawesome/css/all.min.css",
  "./vendor/fontawesome/webfonts/fa-solid-900.woff2",
  "./vendor/fontawesome/webfonts/fa-regular-400.woff2",
  "./vendor/fontawesome/webfonts/fa-brands-400.woff2",
  "./vendor/fontawesome/webfonts/fa-solid-900.ttf",
  "./vendor/fontawesome/webfonts/fa-regular-400.ttf",
  "./vendor/fontawesome/webfonts/fa-brands-400.ttf",
];
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      // إذا الملف موجود بالكاش، رجعه فوراً. إذا لأ، روح جيبه من النت.
      return (
        cacheRes ||
        fetch(event.request).catch(() => {
          // إذا فشل النت والملف مو بالكاش (حالة طارئة)
          if (event.request.url.indexOf(".html") > -1) {
            return caches.match("./index.html");
          }
        })
      );
    })
  );
});
