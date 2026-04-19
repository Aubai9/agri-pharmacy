const CACHE_NAME = "agri-v34"; // غيرنا الرقم لنجبره على التحديث

// 1. الملفات الأساسية فقط (لا تضع مسارات الخطوط هنا لتجنب انهيار النظام)
const coreAssets = [
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

// 2. التثبيت وحفظ الملفات الأساسية
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // نستخدم catch هنا لكي لا يموت النظام إذا فشل تحميل ملف واحد
      return Promise.all(
        coreAssets.map((url) => {
          return cache
            .add(url)
            .catch((err) => console.log("فشل تحميل الملف:", url));
        })
      );
    })
  );
});

// 3. التفعيل ومسح الكاش القديم
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

// 4. استراتيجية الجلب الذكية (الكاش الديناميكي)
self.addEventListener("fetch", (event) => {
  // تجاهل الطلبات التي ليست من نوع GET
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // إذا كان الملف موجوداً في الكاش، أرجعه فوراً (أوفلاين)
      if (cachedResponse) {
        return cachedResponse;
      }

      // إذا لم يكن في الكاش، اذهب للإنترنت، هاته، ثم احفظ نسخة منه في الكاش للمستقبل!
      return fetch(event.request)
        .then((networkResponse) => {
          // التحقق من صحة الاستجابة
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type !== "basic"
          ) {
            return networkResponse;
          }

          // حفظ نسخة في الكاش
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // إذا انقطع الإنترنت تماماً والملف غير موجود بالكاش، نعيد صفحة البداية
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    })
  );
});

// استلام الأمر من المتصفح لقتل النسخة القديمة فوراً
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
