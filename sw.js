const CACHE_NAME = 'plano-v7';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600;700&display=swap'
];

// Kurulum - kritik dosyaları önbelleğe al
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log('Cache hatası:', err));
    })
  );
  self.skipWaiting();
});

// Aktivasyon - eski cache'leri temizle
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - önce network, hata varsa cache
self.addEventListener('fetch', event => {
  // API isteklerini cache'leme
  if (event.request.url.includes('workers.dev') ||
      event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push bildirimleri
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'Plano', body: 'Yeni bildirim' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: data.url || '/',
      actions: [
        { action: 'open', title: 'Aç' },
        { action: 'close', title: 'Kapat' }
      ]
    })
  );
});

// Bildirime tıklama
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    event.waitUntil(clients.openWindow(event.notification.data));
  }
});
