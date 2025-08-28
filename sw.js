const CACHE_NAME = 'vaya-valla-v1';
const urlsToCache = [
  '/',
  '/login',
  '/movimientos',
  '/estadisticas',
  '/contactos',
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
  '/static/img/favicon.ico',
  '/static/img/logo-192x192.png',
  '/static/img/logo-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/awesomplete/1.1.5/awesomplete.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/awesomplete/1.1.5/awesomplete.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css'
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
