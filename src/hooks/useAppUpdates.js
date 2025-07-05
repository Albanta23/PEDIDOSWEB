import { useState } from 'react';

// Hook SIMPLIFICADO para gestionar actualizaciones de la aplicación
// TEMPORALMENTE DESHABILITADO PARA EVITAR REINICIOS CONSTANTES
export const useAppUpdates = () => {
  const [updateAvailable] = useState(false);
  const [isOnline] = useState(navigator.onLine);

  const forceUpdate = () => {
    console.log('Forzando actualización de la aplicación...');
    window.location.reload(true);
  };

  const dismissUpdate = () => {
    console.log('Actualización descartada');
  };

  const checkAppVersion = () => {
    console.log('Verificación de versión deshabilitada temporalmente');
  };

  return {
    updateAvailable,
    isOnline,
    forceUpdate,
    dismissUpdate,
    checkAppVersion
  };
};

// Función utilitaria para verificar si la app está actualizada
export const isAppUpToDate = () => {
  return true; // Siempre devolver true temporalmente
};

// Función para limpiar caché manualmente
export const clearAppCache = async () => {
  console.log('Limpieza de caché deshabilitada temporalmente');
};