import { useState } from 'react';

export const useFeedbackMessages = (currentModo) => {
  const [mensaje, setMensaje] = useState(null);

  const mostrarMensaje = (texto, tipo = 'info', duracion = 2500) => {
    // Condición original: Solo mostrar mensajes en el modo correspondiente
    // Esta condición podría necesitar ajustarse o eliminarse si el hook se usa en contextos
    // donde `currentModo` no es relevante o si se quiere que los mensajes siempre aparezcan.
    // Para replicar el comportamiento más cercano al original (mensajes relevantes post-selección de modo):
    if (currentModo &&
        ((currentModo === 'fabrica' && tipo !== 'tienda') || (currentModo === 'tienda' && tipo !== 'fabrica'))) {
      setMensaje({ texto, tipo });
      setTimeout(() => setMensaje(null), duracion);
    } else if (!currentModo && (tipo === 'info' || tipo === 'warning' || tipo === 'error' || tipo === 'success')) {
      // Permitir mensajes genéricos si no hay modo seleccionado (ej. errores de carga iniciales)
      // o si el tipo no es 'tienda' o 'fabrica' que son específicos de modo.
      // Esto es una ligera desviación para permitir más flexibilidad si es necesario.
      // Si se quieren restringir estrictamente, eliminar este else if.
      setMensaje({ texto, tipo });
      setTimeout(() => setMensaje(null), duracion);
    }
  };

  return { mensaje, mostrarMensaje };
};
