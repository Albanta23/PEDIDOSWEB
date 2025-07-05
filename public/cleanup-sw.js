// Script temporal para limpiar Service Workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      console.log('Desregistrando Service Worker:', registration.scope);
      registration.unregister();
    }
    console.log('Todos los Service Workers desregistrados');
  });
}

// Limpiar todos los cachés
if ('caches' in window) {
  caches.keys().then(function(cacheNames) {
    return Promise.all(
      cacheNames.map(function(cacheName) {
        console.log('Eliminando caché:', cacheName);
        return caches.delete(cacheName);
      })
    );
  }).then(function() {
    console.log('Todos los cachés eliminados');
    alert('Service Workers y cachés limpiados. Recarga la página.');
  });
}
