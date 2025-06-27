import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { obtenerPedidos } from '../services/pedidosService'; // Para recarga global y carga inicial

export const useSocketManager = (
    currentModo,
    currentTiendaSeleccionada,
    mostrarMensajeCallback, // de useFeedbackMessages
    updatePedidosCallback, // de usePedidoManager (setPedidos o una función que lo actualice)
    setInitialPedidos // para cargar los pedidos iniciales en usePedidoManager
) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Función global de recarga (originalmente en App.jsx)
  // Necesita acceso a `currentModo` y `mostrarMensajeCallback` y `setInitialPedidos`
  const recargarPedidosGlobal = useCallback(async () => {
    if (currentModo !== 'fabrica') return;
    try {
      const data = await obtenerPedidos();
      setInitialPedidos(data); // Actualiza el estado en usePedidoManager
      // mostrarMensajeCallback('Pedidos recargados (global)', 'info'); // Opcional
    } catch (error) {
      if (currentModo === 'fabrica') {
        mostrarMensajeCallback('Error al recargar pedidos globalmente', 'warning');
      }
      console.error("Error en recargarPedidosGlobal:", error);
    }
  }, [currentModo, mostrarMensajeCallback, setInitialPedidos]);

  useEffect(() => {
    // Hacer la función de recarga globalmente accesible si es necesario
    // Esto es un efecto secundario que podría considerarse anti-patrón en React puro,
    // pero replica la funcionalidad existente.
    // Una mejor aproximación sería manejar la recarga a través de eventos o estado.
    window.recargarPedidosGlobal = recargarPedidosGlobal;

    return () => {
      // Limpiar la función global cuando el hook se desmonte o recargarPedidosGlobal cambie
      if (window.recargarPedidosGlobal === recargarPedidosGlobal) {
        delete window.recargarPedidosGlobal;
      }
    };
  }, [recargarPedidosGlobal]);


  useEffect(() => {
    // La conexión del socket depende del modo, ya que algunas lógicas de eventos cambian.
    // Si currentModo es null, podríamos no conectar o conectar y luego filtrar eventos.
    // Por ahora, conectaremos siempre que el hook esté activo.
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://pedidos-backend-0e1s.onrender.com');
    setSocket(newSocket);

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    // Carga inicial de pedidos a través del socket o API.
    // App.jsx hacía un fetchPedidos inicial. Aquí podemos replicarlo
    // o confiar en un evento 'pedidos_inicial' del socket si el backend lo soporta bien.
    // Por consistencia con App.jsx, haremos un fetch inicial aquí también,
    // pero solo si currentModo está definido.
    const fetchInitialData = async () => {
        if (currentModo) { // Solo cargar si ya hay un modo seleccionado
            try {
                const data = await obtenerPedidos();
                setInitialPedidos(data); // Carga los pedidos en usePedidoManager
            } catch (error) {
                 mostrarMensajeCallback(`Error al cargar pedidos iniciales (${currentModo})`, 'warning');
                 console.error("Error fetching initial pedidos for socket manager:", error);
            }
        }
    };
    fetchInitialData();

    newSocket.on('pedido_nuevo', (pedidoNuevo) => {
      if (currentModo === 'fabrica') {
        updatePedidosCallback(prevPedidos => [...prevPedidos, pedidoNuevo]);
        mostrarMensajeCallback('Nuevo pedido recibido', 'info');
      } else if (currentModo === 'tienda' && pedidoNuevo.tiendaId === currentTiendaSeleccionada) {
        // Si la tienda actual es la afectada, actualizar sus pedidos
        updatePedidosCallback(prevPedidos => [...prevPedidos, pedidoNuevo]);
        // Podríamos querer un mensaje específico para la tienda aquí
        // mostrarMensajeCallback(`Nuevo pedido para tu tienda: ${pedidoNuevo.numeroPedido}`, 'info');
      }
    });

    newSocket.on('pedido_actualizado', (pedidoActualizado) => {
      if (currentModo === 'fabrica') {
        updatePedidosCallback(prevPedidos =>
          prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
        );
        mostrarMensajeCallback('Pedido actualizado en tiempo real', 'info');
      } else if (currentModo === 'tienda' && pedidoActualizado.tiendaId === currentTiendaSeleccionada) {
        updatePedidosCallback(prevPedidos =>
          prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
        );
        // mostrarMensajeCallback(`Pedido ${pedidoActualizado.numeroPedido} actualizado`, 'info');
      }
    });

    newSocket.on('pedido_eliminado', (pedidoEliminado) => {
      // El backend envía el pedido completo o solo su ID. Asumimos que es el objeto del pedido.
      // Si solo es el ID, necesitaríamos ajustar la lógica.
      const idEliminado = pedidoEliminado._id || pedidoEliminado.id || pedidoEliminado;

      if (currentModo === 'fabrica') {
        updatePedidosCallback(prevPedidos =>
          prevPedidos.filter(p => (p._id !== idEliminado && p.id !== idEliminado))
        );
        mostrarMensajeCallback('Pedido eliminado en tiempo real', 'info');
      } else if (currentModo === 'tienda' && pedidoEliminado.tiendaId === currentTiendaSeleccionada) {
         updatePedidosCallback(prevPedidos =>
          prevPedidos.filter(p => (p._id !== idEliminado && p.id !== idEliminado))
        );
        // mostrarMensajeCallback(`Pedido eliminado de tu tienda`, 'info');
      }
    });

    // Evento para recibir todos los pedidos (ej. al reconectar o si el server lo emite)
    newSocket.on('pedidos_inicial', (pedidosIniciales) => {
      if (currentModo === 'fabrica') {
        setInitialPedidos(pedidosIniciales);
      } else if (currentModo === 'tienda' && currentTiendaSeleccionada) {
        setInitialPedidos(pedidosIniciales.filter(p => p.tiendaId === currentTiendaSeleccionada));
      } else if (currentModo === 'tienda' && !currentTiendaSeleccionada){
        // Modo tienda pero sin tienda aún (ej. en login), no filtrar.
        // Esto podría necesitar ajuste dependiendo de cuándo se establece currentTiendaSeleccionada.
        setInitialPedidos(pedidosIniciales);
      }
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('pedido_nuevo');
      newSocket.off('pedido_actualizado');
      newSocket.off('pedido_eliminado');
      newSocket.off('pedidos_inicial');
      newSocket.disconnect();
      setIsConnected(false);
      setSocket(null);
    };
    // Dependencias: currentModo y currentTiendaSeleccionada son claves para la lógica de filtrado.
    // Las callbacks deben ser estables (envueltas en useCallback en sus respectivos hooks).
  }, [currentModo, currentTiendaSeleccionada, mostrarMensajeCallback, updatePedidosCallback, setInitialPedidos, recargarPedidosGlobal]);

  return { socket, isConnected };
};
