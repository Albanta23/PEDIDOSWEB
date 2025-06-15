// Service Worker para gestión de caché y actualizaciones
const CACHE_NAME = 'pedidos-carniceria-v' + Date.now();
const API_CACHE_NAME = 'pedidos-api-cache';

// Recursos que se deben cachear
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Instalar el service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activar el service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activando...');
  
  event.waitUntil(
    // Limpiar cachés antiguos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las páginas
      return self.clients.claim();
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para recursos estáticos (JS, CSS, imágenes)
  if (event.request.destination === 'script' || 
      event.request.destination === 'style' || 
      event.request.destination === 'image') {
    
    event.respondWith(
      // Siempre buscar en red primero (Network First)
      fetch(event.request)
        .then((response) => {
          // Si la respuesta es válida, cachearla
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, buscar en caché
          return caches.match(event.request);
        })
    );
  }
  
  // Para llamadas a la API
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      // Network First para APIs
      fetch(event.request)
        .then((response) => {
          // Cachear solo respuestas exitosas de GET
          if (event.request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red y es GET, buscar en caché
          if (event.request.method === 'GET') {
            return caches.match(event.request);
          }
          // Para otros métodos, propagar el error
          throw error;
        })
    );
  }
  
  // Para el documento HTML principal
  else if (event.request.destination === 'document') {
    event.respondWith(
      // Siempre buscar en red para HTML (para detectar actualizaciones)
      fetch(event.request)
        .catch(() => {
          // Si falla la red, servir desde caché
          return caches.match('/');
        })
    );
  }
});

// Mensaje desde el cliente para forzar actualización
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_UPDATE') {
    console.log('Service Worker: Forzando actualización...');
    
    // Limpiar todos los cachés
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      // Notificar a todos los clientes para que se recarguen
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'RELOAD_REQUIRED' });
        });
      });
    });
  }
});

// Notificar cuando hay una nueva versión disponible
self.addEventListener('updatefound', () => {
  console.log('Service Worker: Nueva versión detectada');
  
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: 'UPDATE_AVAILABLE' });
    });
  });
});
