const CACHE_NAME = 'vaya-valla-v1';
const urlsToCache = [
  '/',
  '/static/css/styles.css',
  '/static/css/navbar.css',
  '/static/css/movimientos.css',
  '/static/css/edicion-movimientos.css',
  '/static/css/spinner.css',
  '/static/bootstrap/bootstrap.min.css',
  '/static/js/script.js',
  '/static/js/auth.js',
  '/static/js/contactos.js',
  '/static/js/estadisticas.js',
  '/static/js/movimientos.js',
  '/static/js/navbar.js',
  '/static/js/storage.js',
  '/static/img/logo.png',
  '/static/img/favicon.ico'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            var responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/static/img/logo.png',
    badge: '/static/img/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'Ver detalles'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Vaya Valla Finanzas', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/movimientos')
    );
  }
});
