import { useState, useEffect } from 'react';

// Hook para gestionar actualizaciones de la aplicación
export const useAppUpdates = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastVersion, setLastVersion] = useState(null);

  useEffect(() => {
    // Registrar service worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Verificar estado de conexión
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar actualizaciones periódicamente
    const checkForUpdates = () => {
      if (isOnline) {
        checkAppVersion();
      }
    };

    // Verificar cada 30 segundos si hay actualizaciones
    const intervalId = setInterval(checkForUpdates, 30000);

    // Verificar inmediatamente
    checkForUpdates();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      console.log('Service Worker registrado:', registration);

      // Escuchar mensajes del service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'UPDATE_AVAILABLE') {
          console.log('Actualización disponible detectada');
          setUpdateAvailable(true);
          showUpdateNotification();
        } else if (event.data.type === 'RELOAD_REQUIRED') {
          console.log('Recarga requerida');
          window.location.reload(true);
        }
      });

      // Verificar si hay una actualización esperando
      if (registration.waiting) {
        setUpdateAvailable(true);
        showUpdateNotification();
      }

      // Verificar actualizaciones
      registration.addEventListener('updatefound', () => {
        console.log('Nueva versión encontrada');
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nueva versión disponible
              setUpdateAvailable(true);
              showUpdateNotification();
            }
          }
        });
      });

    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  };

  const checkAppVersion = async () => {
    try {
      // Verificar versión del servidor
      const response = await fetch('/manifest.json?' + Date.now(), {
        cache: 'no-cache'
      });
      
      if (response.ok) {
        const currentVersion = window.APP_VERSION;
        const serverTimestamp = response.headers.get('last-modified') || 
                               response.headers.get('date');
        
        if (lastVersion && serverTimestamp !== lastVersion) {
          console.log('Nueva versión detectada en servidor');
          setUpdateAvailable(true);
          showUpdateNotification();
        }
        
        setLastVersion(serverTimestamp);
      }
    } catch (error) {
      console.log('Error verificando versión:', error);
    }
  };

  const showUpdateNotification = () => {
    const notification = document.getElementById('update-notification');
    if (notification) {
      notification.style.display = 'block';
    }
  };

  const forceUpdate = () => {
    console.log('Forzando actualización de la aplicación...');
    
    // Enviar mensaje al service worker para limpiar cachés
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'FORCE_UPDATE'
      });
    }

    // Limpiar caché del navegador
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Limpiar localStorage y sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.log('No se pudo limpiar storage:', e);
    }

    // Recargar la página forzando descarga desde servidor
    setTimeout(() => {
      window.location.reload(true);
    }, 1000);
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
    const notification = document.getElementById('update-notification');
    if (notification) {
      notification.style.display = 'none';
    }
  };

  return {
    updateAvailable,
    isOnline,
    forceUpdate,
    dismissUpdate,
    checkAppVersion: () => checkAppVersion()
  };
};

// Función utilitaria para verificar si la app está actualizada
export const isAppUpToDate = () => {
  const buildTime = window.APP_VERSION;
  const sessionStart = sessionStorage.getItem('app_session_start');
  
  if (!sessionStart) {
    sessionStorage.setItem('app_session_start', buildTime.toString());
    return true;
  }
  
  return parseInt(sessionStart) >= buildTime;
};

// Función para limpiar caché manualmente
export const clearAppCache = async () => {
  console.log('Limpiando caché de la aplicación...');
  
  // Limpiar service worker cache
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
  }
  
  // Limpiar storage
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.log('Error limpiando storage:', e);
  }
  
  console.log('Caché limpiado completamente');
};
