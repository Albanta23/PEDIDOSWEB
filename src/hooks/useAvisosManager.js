import { useState, useEffect } from 'react';
import { listarAvisos, marcarAvisoVisto } from '../services/avisosService'; // Asumiendo que el path es correcto

export const useAvisosManager = (modo, logueado, tiendaSeleccionada, pedidosTrigger) => {
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    if (modo !== 'tienda' || !logueado || !tiendaSeleccionada) {
      setAvisos([]); // Limpiar avisos si no estamos en el contexto adecuado
      return;
    }

    async function fetchAvisos() {
      try {
        const avisosBD = await listarAvisos(tiendaSeleccionada);
        // Filtrar los que no han sido vistos por la tienda actual
        const avisosPendientes = avisosBD
          .filter(a => !a.vistoPor.includes(tiendaSeleccionada))
          .map(a => ({
            id: a.referenciaId, // El ID de referencia del aviso (ej. ID del pedido)
            _id: a._id, // El ID propio del documento de aviso
            tipo: a.tipo,
            texto: a.texto,
          }));
        setAvisos(avisosPendientes);
      } catch (error) {
        console.error("Error al cargar avisos:", error);
        setAvisos([]); // Limpiar en caso de error
      }
    }

    fetchAvisos();
    // `pedidosTrigger` es una dependencia para forzar la recarga de avisos si los pedidos cambian,
    // ya que un nuevo pedido podría generar un nuevo aviso.
  }, [modo, logueado, tiendaSeleccionada, pedidosTrigger]);

  const handleMarcarAvisoVisto = async (aviso) => {
    if (!aviso || !aviso._id || !tiendaSeleccionada) return;
    try {
      await marcarAvisoVisto(aviso._id, tiendaSeleccionada);
      // Optimistamente remover el aviso de la lista local
      setAvisos(prevAvisos => prevAvisos.filter(a => a._id !== aviso._id));
    } catch (error) {
      console.error("Error al marcar aviso como visto:", error);
      // Podríamos tener un mensaje de error al usuario aquí
    }
  };

  return { avisos, handleMarcarAvisoVisto, setAvisos };
};
