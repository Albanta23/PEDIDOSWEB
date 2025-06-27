import { useState, useEffect, useCallback } from 'react';
import { obtenerPedidos, crearPedido, actualizarPedido, eliminarPedido } from '../services/pedidosService';

export const usePedidoManager = (initialPedidos = [], currentModo, currentTiendaSeleccionada, mostrarMensajeCallback) => {
  const [pedidos, setPedidos] = useState(initialPedidos);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  // Carga inicial de pedidos y recarga cuando el modo o tienda cambian (si aplica)
  const fetchPedidos = useCallback(async () => {
    setLoadingPedidos(true);
    try {
      const data = await obtenerPedidos(); // Podría necesitar filtros por tienda si es modo tienda
      if (currentModo === 'tienda' && currentTiendaSeleccionada) {
        setPedidos(data.filter(p => p.tiendaId === currentTiendaSeleccionada));
      } else {
        setPedidos(data);
      }
    } catch (error) {
      mostrarMensajeCallback('Error al cargar pedidos', 'warning');
      console.error("Error fetching pedidos:", error);
    } finally {
      setLoadingPedidos(false);
    }
  }, [currentModo, currentTiendaSeleccionada, mostrarMensajeCallback]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]); // Se ejecuta al montar y cuando fetchPedidos cambia (debido a sus dependencias)

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    const pedidoOriginal = pedidos.find(p => p._id === pedidoId || p.id === pedidoId);
    if (!pedidoOriginal) return;

    // Optimistic update
    // setPedidos(prevPedidos =>
    //   prevPedidos.map(p => (p._id === pedidoId || p.id === pedidoId) ? { ...p, estado: nuevoEstado } : p)
    // );

    try {
      let actualizadoPayload = { ...pedidoOriginal, estado: nuevoEstado };
      if (nuevoEstado === 'preparado' || nuevoEstado === 'enviadoTienda') {
        const fechaEnvio = pedidoOriginal.fechaEnvio || new Date().toISOString();
        actualizadoPayload = {
          ...actualizadoPayload,
          fechaEnvio,
          lineas: pedidoOriginal.lineas.map(linea => ({
            ...linea,
            cantidadEnviada: linea.cantidadEnviada !== undefined ? Number(linea.cantidadEnviada) : Number(linea.cantidad),
            lote: linea.lote || '',
            fechaEnvioLinea: linea.fechaEnvioLinea || fechaEnvio,
          })),
        };
      }
      if (nuevoEstado === 'enviadoTienda') {
        actualizadoPayload = {
          ...actualizadoPayload,
          fechaRecepcion: new Date().toISOString(),
        };
      }

      const pedidoActualizado = await actualizarPedido(pedidoOriginal._id || pedidoOriginal.id, actualizadoPayload);
      // Actualizar con la respuesta del servidor para asegurar consistencia
      setPedidos(prevPedidos =>
         prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
      );
      // El socket debería encargarse de actualizar para otros clientes, pero esto actualiza localmente de inmediato.
      // Si el socket ya actualiza, esta línea podría ser redundante o causar doble actualización.
      // Es importante coordinar con useSocketManager.

      if (nuevoEstado === 'preparado') mostrarMensajeCallback('Pedido preparado', 'success');
      if (nuevoEstado === 'enviadoTienda') mostrarMensajeCallback('Pedido enviado a tienda', 'success');
    } catch (error) {
      mostrarMensajeCallback('Error al cambiar estado del pedido', 'warning');
      // Revert optimistic update if needed
      // setPedidos(prevPedidos => prevPedidos.map(p => (p._id === pedidoId || p.id === pedidoId) ? pedidoOriginal : p));
      console.error("Error cambiando estado pedido:", error);
    }
  };

  const cambiarEstadoLinea = async (pedidoId, idxLinea, preparada) => {
    const pedidoOriginal = pedidos.find(p => p._id === pedidoId || p.id === pedidoId);
    if (!pedidoOriginal) return;

    try {
      const nuevasLineas = pedidoOriginal.lineas.map((l, idx) =>
        idx === idxLinea ? { ...l, preparada } : l
      );
      const actualizado = { ...pedidoOriginal, lineas: nuevasLineas };

      const pedidoActualizado = await actualizarPedido(pedidoOriginal._id || pedidoOriginal.id, actualizado);
      setPedidos(prevPedidos =>
        prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
      );
      // mostrarMensajeCallback('Estado de línea actualizado', 'info'); // Opcional
    } catch (error) {
      mostrarMensajeCallback('Error al cambiar estado de línea', 'warning');
      console.error("Error cambiando estado linea:", error);
    }
  };

  const cambiarEstadoLineaDetalle = async (pedidoId, idxLinea, cambios) => {
    const pedidoOriginal = pedidos.find(p => p._id === pedidoId || p.id === pedidoId);
    if (!pedidoOriginal) return;

    try {
      let nuevasLineas;
      if (idxLinea === null && Array.isArray(cambios)) {
        nuevasLineas = cambios; // Reemplazo total de líneas
      } else {
        nuevasLineas = pedidoOriginal.lineas.map((l, idx) =>
          idx === idxLinea ? { ...l, ...cambios } : l
        );
      }
      const actualizado = { ...pedidoOriginal, lineas: nuevasLineas };

      const pedidoActualizado = await actualizarPedido(pedidoOriginal._id || pedidoOriginal.id, actualizado);
      setPedidos(prevPedidos =>
        prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
      );
      // mostrarMensajeCallback('Detalle de línea actualizado', 'info'); // Opcional
    } catch (error) {
      mostrarMensajeCallback('Error al actualizar detalle de línea', 'warning');
      console.error("Error cambiando detalle linea:", error);
    }
  };

  const agregarPedidoLocal = async (pedidoData) => {
    if (!currentTiendaSeleccionada && currentModo === 'tienda') {
        mostrarMensajeCallback('No se ha seleccionado una tienda para el pedido.', 'warning');
        return;
    }
    try {
      // El backend asignará el numeroPedido
      const nuevoPedidoPayload = {
        ...pedidoData,
        tiendaId: currentTiendaSeleccionada, // Asegurar que tiendaId se toma del hook de autenticación
        estado: 'enviado', // Estado por defecto al crear desde tienda
        fechaCreacion: new Date().toISOString(),
      };
      const pedidoCreado = await crearPedido(nuevoPedidoPayload);
      // El socket debería emitir 'pedido_nuevo'.
      // Si este hook también escucha, se podría duplicar.
      // Una opción es que este hook actualice el estado directamente y confíe en el socket para otros.
      // O que el socket sea la única fuente de verdad para nuevas adiciones/actualizaciones.
      // Por simplicidad y para evitar conflicto con el socket, no actualizaremos `pedidos` aquí directamente.
      // setPedidos(prevPedidos => [...prevPedidos, pedidoCreado]);
      // La actualización vendrá del hook del socket.
      mostrarMensajeCallback('Pedido añadido correctamente. Actualizando...', 'success');
      // fetchPedidos(); // Opcional: forzar recarga, pero el socket debería manejarlo.
    } catch (error) {
      mostrarMensajeCallback('Error al crear pedido', 'warning');
      console.error("Error agregando pedido:", error);
    }
  };

  const modificarPedidoLocal = async (pedidoId, nuevoPedidoData) => {
    // Aquí 'pedidoId' es el _id del pedido. 'idx' no se usa más.
    try {
      const pedidoActualizado = await actualizarPedido(pedidoId, nuevoPedidoData);
      // Similar al agregar, el socket debería manejar la actualización.
      // setPedidos(prevPedidos =>
      //   prevPedidos.map(p => (p._id === pedidoActualizado._id) ? pedidoActualizado : p)
      // );
      mostrarMensajeCallback('Pedido actualizado. Actualizando...', 'success');
      // fetchPedidos(); // Opcional
    } catch (error) {
      mostrarMensajeCallback('Error al actualizar pedido', 'warning');
      console.error("Error modificando pedido:", error);
    }
  };

  const borrarPedidoLocal = async (pedidoId) => {
    // Aquí 'pedidoId' es el _id del pedido. 'idx' no se usa más.
    try {
      await eliminarPedido(pedidoId);
      // El socket debería manejar la eliminación.
      // setPedidos(prevPedidos => prevPedidos.filter(p => p._id !== pedidoId));
      mostrarMensajeCallback('Pedido borrado. Actualizando...', 'info');
      // fetchPedidos(); // Opcional
    } catch (error) {
      mostrarMensajeCallback('Error al borrar pedido', 'warning');
      console.error("Error borrando pedido:", error);
    }
  };

  // Función para que el hook de socket pueda actualizar los pedidos
  // Esto es crucial si el hook de socket es la fuente de verdad para cambios en tiempo real.
  const updatePedidosDesdeSocket = useCallback((updaterFn) => {
    setPedidos(updaterFn);
  }, []);


  return {
    pedidos,
    setPedidos, // Exponer setPedidos para que useSocketManager pueda actualizarlo.
    loadingPedidos,
    fetchPedidos, // Para recargas manuales si es necesario
    cambiarEstadoPedido,
    cambiarEstadoLinea,
    cambiarEstadoLineaDetalle,
    agregarPedido: agregarPedidoLocal,
    modificarPedido: modificarPedidoLocal,
    borrarPedido: borrarPedidoLocal,
    updatePedidosDesdeSocket
  };
};
