// Service Worker simplificado para evitar problemas de conexión
const CACHE_NAME = 'pedidos-carniceria-simple-v1';

// Recursos básicos que se deben cachear
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker Simple: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker Simple: Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
  );
  
  // Tomar control inmediatamente
  self.skipWaiting();
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker Simple: Activando...');
  
  event.waitUntil(
    // Limpiar cachés antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker Simple: Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control de todas las páginas
  return self.clients.claim();
});

// Interceptar solo recursos estáticos básicos, NO APIs ni Socket.IO
self.addEventListener('fetch', (event) => {
  // Solo cachear recursos estáticos muy específicos
  if (event.request.method === 'GET' && 
      (event.request.url.endsWith('/') ||
       event.request.url.endsWith('/manifest.json') ||
       event.request.url.endsWith('/favicon.ico'))) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Si está en caché, devolverlo
          if (response) {
            return response;
          }
          
          // Si no, hacer fetch y cachear
          return fetch(event.request)
            .then((response) => {
              // Solo cachear respuestas exitosas
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            });
        })
    );
  }
  // Para todo lo demás (APIs, Socket.IO, JS, CSS), dejar pasar sin interceptar
});
