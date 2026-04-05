// غير الرقم لكي يعرف المتصفح أن هذا ملف جديد كلياً
const CACHE_NAME = "agri-v27";

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
];

// تنصيب وإجبار على التفعيل الفوري
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(assets))
  );
});

// تفعيل ومسح الكاش القديم فوراً
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

// استراتيجية جلب الملفات (هنا يكمن السحر)
self.addEventListener("fetch", (event) => {
  // 1. بالنسبة لصفحة الـ HTML (الموقع نفسه): الإنترنت أولاً ثم الكاش
  if (
    event.request.mode === "navigate" ||
    (event.request.headers.get("accept") &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // تحديث الكاش بالنسخة الجديدة فوراً
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => {
          // إذا كان أوفلاين، افتح من الكاش
          return caches.match(event.request) || caches.match("./index.html");
        })
    );
  } else {
    // 2. بالنسبة لباقي الملفات (صور، CSS، JS): الكاش أولاً للسرعة
    event.respondWith(
      caches.match(event.request).then((cacheRes) => {
        return cacheRes || fetch(event.request);
      })
    );
  }
});

// استقبال أمر التحديث من زر "موافق"
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
