import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';
import FabricaPanel from './components/FabricaPanel';
import Login from './components/Login';
import PedidoList from './components/PedidoList';
import HistoricoTienda from './components/HistoricoTienda';
import ErrorLogger from './components/ErrorLogger';
import HistoricoFabrica from './components/HistoricoFabrica';
import HistoricoTiendaPanel from './components/HistoricoTiendaPanel';
import SeleccionModo from './components/SeleccionModo';
import Watermark from './components/Watermark';
import { abrirHistoricoEnVentana } from './utils/historicoVentana';
import { obtenerPedidos, crearPedido, actualizarPedido, eliminarPedido } from './services/pedidosService';
import { listarAvisos, crearAviso, marcarAvisoVisto } from './services/avisosService';
import ProductosPanel from './components/ProductosPanel';
import LotesPanel from './components/LotesPanel';
import StockPanel from './components/StockPanel';
import MovimientosStockPanel from './components/MovimientosStockPanel';
import FabricacionPanel from './components/FabricacionPanel';
import BajasAjustesPanel from './components/BajasAjustesPanel';
import AvisosPanel from './components/AvisosPanel';

const tiendas = [
  { id: 'tienda1', nombre: 'TIENDA BUS' },
  { id: 'tienda2', nombre: 'TIENDA SALAMANCA 1' },
  { id: 'tienda3', nombre: 'TIENDA SALAMANCA 2' },
  { id: 'tienda4', nombre: 'TIENDA PINILLA' },
  { id: 'tienda5', nombre: 'TIENDA TRES CRUCES' },
  { id: 'tienda6', nombre: 'TIENDA PLAZA DE ALEMANIA' },
  { id: 'tienda7', nombre: 'TIENDA AVDA GALICIA' },
  { id: 'tienda8', nombre: 'TIENDA MORADAS' },
  { id: 'tienda9', nombre: 'TIENDA FABRICA' },
  { id: 'tienda10', nombre: 'TIENDA HAM&WINE' },
  { id: 'clientes', nombre: 'PEDIDOS CLIENTES' }
];
window.tiendas = tiendas;

function generarIdUnico() {
  return 'pedido_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function App() {
  const [pedidos, setPedidos] = useState([]);
  const [socket, setSocket] = useState(null);
  const [modo, setModo] = useState(null); // null, 'fabrica', 'tienda'
  const [logueado, setLogueado] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [mostrarHistoricoFabrica, setMostrarHistoricoFabrica] = useState(false);
  const [mostrarHistoricoTienda, setMostrarHistoricoTienda] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);

  // --- ESTADO PARA FEEDBACK UX ---
  const [mensaje, setMensaje] = useState(null);

  // --- NUEVO: Estado para avisos de nuevos pedidos/traspasos recibidos ---
  const [avisos, setAvisos] = useState([]);

  // --- NUEVO: Estado para roles de usuario ---
  const [rolUsuario, setRolUsuario] = useState('usuario'); // 'usuario', 'fabrica', 'supervisor', 'admin'

  // --- FEEDBACK TEMPORAL ---
  function mostrarMensaje(texto, tipo = 'info', duracion = 2500) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), duracion);
  }

  useEffect(() => {
    // Conexión de Socket.io
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'https://pedidos-backend-0e1s.onrender.com'); 
    setSocket(newSocket);

    const fetchPedidos = async () => {
      try {
        const data = await obtenerPedidos();
        setPedidos(data);
      } catch (error) {
        setMensaje({ texto: 'Error al cargar pedidos', tipo: 'warning' });
      }
    };
    fetchPedidos();

    // Listeners de Socket.io
    newSocket.on('pedido_nuevo', (pedidoNuevo) => {
      setPedidos(prevPedidos => [...prevPedidos, pedidoNuevo]);
      mostrarMensaje('Nuevo pedido recibido', 'info');
    });

    newSocket.on('pedido_actualizado', (pedidoActualizado) => {
      console.log('[FRONTEND] Evento pedido_actualizado recibido:', pedidoActualizado);
      setPedidos(prevPedidos => 
        prevPedidos.map(p => (p._id === pedidoActualizado._id || p.id === pedidoActualizado.id) ? pedidoActualizado : p)
      );
      mostrarMensaje('Pedido actualizado en tiempo real', 'info');
    });

    newSocket.on('pedido_eliminado', (pedidoEliminado) => {
      setPedidos(prevPedidos => 
        prevPedidos.filter(p => (p._id !== pedidoEliminado._id && p.id !== pedidoEliminado.id))
      );
      mostrarMensaje('Pedido eliminado en tiempo real', 'info');
    });
    
    newSocket.on('pedidos_inicial', (pedidosIniciales) => {
      setPedidos(pedidosIniciales);
    });

    // Limpieza al desmontar el componente
    return () => {
      newSocket.off('pedido_nuevo');
      newSocket.off('pedido_actualizado');
      newSocket.off('pedido_eliminado');
      newSocket.off('pedidos_inicial');
      newSocket.disconnect();
    };
  }, []);

  // Detectar nuevos pedidos recibidos o traspasos para la tienda seleccionada
  useEffect(() => {
    if (modo !== 'tienda' || !logueado || !tiendaSeleccionada) return;
    async function fetchAvisos() {
      const avisosBD = await listarAvisos(tiendaSeleccionada);
      setAvisos(avisosBD.filter(a => !a.vistoPor.includes(tiendaSeleccionada)).map(a => ({
        id: a.referenciaId,
        tipo: a.tipo,
        texto: a.texto
      })));
    }
    fetchAvisos();
  }, [pedidos, modo, logueado, tiendaSeleccionada]);

  // Función para gestionar click en un aviso (ahora solo lo navega, no lo marca como visto)
  const handleAvisoClick = (aviso) => {
    setMostrarHistoricoTienda(true);
  };

  // Función para marcar un aviso como visto y eliminarlo
  const handleAvisoVisto = async (aviso) => {
    const avisosBD = await listarAvisos(tiendaSeleccionada);
    const avisoBD = avisosBD.find(a => a.referenciaId === aviso.id);
    if (avisoBD) {
      await marcarAvisoVisto(avisoBD._id, tiendaSeleccionada);
      setAvisos(prev => prev.filter(a => a.id !== aviso.id));
    }
  };

  // Cambia el estado de un pedido y lo persiste en MongoDB
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId || p._id === pedidoId);
      if (!pedido) return;
      let actualizado = { ...pedido, estado: nuevoEstado };
      // --- ACTUALIZAR DETALLES DE LÍNEA AL CAMBIAR DE ESTADO ---
      if (nuevoEstado === 'preparado' || nuevoEstado === 'enviadoTienda') {
        const fechaEnvio = pedido.fechaEnvio || new Date().toISOString();
        actualizado = {
          ...actualizado,
          fechaEnvio,
          lineas: pedido.lineas.map(linea => ({
            ...linea,
            cantidadEnviada: linea.cantidadEnviada !== undefined ? Number(linea.cantidadEnviada) : Number(linea.cantidad),
            lote: linea.lote || '',
            fechaEnvioLinea: linea.fechaEnvioLinea || fechaEnvio
          }))
        };
      }
      if (nuevoEstado === 'enviadoTienda') {
        actualizado = {
          ...actualizado,
          fechaRecepcion: new Date().toISOString()
        };
      }
      await actualizarPedido(pedido._id || pedido.id, actualizado);
      const data = await obtenerPedidos();
      setPedidos(data);
      if (nuevoEstado === 'preparado') mostrarMensaje('Pedido preparado', 'success');
      if (nuevoEstado === 'enviadoTienda') mostrarMensaje('Pedido enviado a tienda', 'success');
    } catch (error) {
      mostrarMensaje('Error al cambiar estado', 'warning');
    }
  };

  // Cambia el estado de una línea de pedido y lo persiste en MongoDB
  const cambiarEstadoLinea = async (pedidoId, idxLinea, preparada) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId || p._id === pedidoId);
      if (!pedido) return;
      const nuevasLineas = pedido.lineas.map((l, idx) => idx === idxLinea ? { ...l, preparada } : l);
      const actualizado = { ...pedido, lineas: nuevasLineas };
      await actualizarPedido(pedido._id || pedido.id, actualizado);
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (error) {
      mostrarMensaje('Error al cambiar estado de línea', 'warning');
    }
  };

  // Cambia detalles de una línea de pedido y lo persiste en MongoDB
  const cambiarEstadoLineaDetalle = async (pedidoId, idxLinea, cambios) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId || p._id === pedidoId);
      if (!pedido) return;
      let nuevasLineas;
      if (idxLinea === null && Array.isArray(cambios)) { 
        nuevasLineas = cambios; 
      } else {
        nuevasLineas = pedido.lineas.map((l, idx) => idx === idxLinea ? { ...l, ...cambios } : l);
      }
      const actualizado = { ...pedido, lineas: nuevasLineas };
      
      console.log('[App.jsx] Actualizando pedido en backend con lineas:', actualizado.lineas);
      await actualizarPedido(pedido._id || pedido.id, actualizado); 
      
      const data = await obtenerPedidos(); 
      setPedidos(data);
      const pedidoRefrescado = data.find(p => p.id === pedidoId || p._id === pedidoId);
      console.log('[App.jsx] Pedido refrescado desde backend, lineas:', pedidoRefrescado?.lineas);

    } catch (error) {
      mostrarMensaje('Error al actualizar línea', 'warning');
      console.error('Error en cambiarEstadoLineaDetalle:', error);
    }
  };

  const handleLogin = (usuario, tiendaId, rol = 'usuario') => {
    setLogueado(true);
    setRolUsuario(rol);
    if (modo === 'tienda' ) setTiendaSeleccionada(tiendaId);
  };

  const agregarPedido = async (pedido) => {
    try {
      const maxNumero = pedidos.reduce((max, p) => p.numeroPedido && p.numeroPedido > max ? p.numeroPedido : max, 0);
      const nuevoNumero = maxNumero + 1;
      await crearPedido({
        ...pedido,
        tiendaId: tiendaSeleccionada,
        estado: 'enviado',
        fechaCreacion: new Date().toISOString()
        // El número de pedido lo asigna el backend
      });
      const data = await obtenerPedidos();
      setPedidos(data);
      mostrarMensaje('Pedido añadido correctamente', 'success');
    } catch (error) {
      mostrarMensaje('Error al crear pedido', 'warning');
    }
  };

  const modificarPedido = async (idx, nuevoPedido) => {
    try {
      const pedido = pedidos[idx];
      await actualizarPedido(pedido._id, nuevoPedido);
      const data = await obtenerPedidos();
      setPedidos(data);
      mostrarMensaje('Pedido actualizado', 'success');
    } catch (error) {
      mostrarMensaje('Error al actualizar pedido', 'warning');
    }
  };

  const borrarPedido = async (idx) => {
    try {
      const pedido = pedidos[idx];
      await eliminarPedido(pedido._id);
      const data = await obtenerPedidos();
      setPedidos(data);
      mostrarMensaje('Pedido borrado', 'info');
    } catch (error) {
      mostrarMensaje('Error al borrar pedido', 'warning');
    }
  };

  function handleEditarPedido(pedido) {
    setPedidoEditando(pedido);
  }

  useEffect(() => {
    if (logueado && modo === 'tienda') {
      console.log('[DEBUG] tiendaSeleccionada:', tiendaSeleccionada);
    }
  }, [tiendaSeleccionada, logueado, modo]);

  useEffect(() => {
    console.log('[DEBUG App.jsx] VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('[DEBUG App.jsx] tiendaSeleccionada:', tiendaSeleccionada);
  }, [tiendaSeleccionada]);

  if (!modo) {
    return <SeleccionModo onSeleccion={setModo} pedidos={pedidos} tiendas={tiendas} />;
  }

  if (!logueado) {
    return (
      <div className="App">
        <Watermark />
        <Login
          tipo={modo}
          onLogin={handleLogin}
          tiendas={modo === 'tienda' ? tiendas : undefined}
        />
        <ErrorLogger />
      </div>
    );
  }

  return (
    <Router>
      <div style={{display:'flex',minHeight:'100vh',background:'#f5f7fa'}}>
        <nav style={{width:220,background:'#1976d2',color:'#fff',padding:'32px 0',display:'flex',flexDirection:'column',gap:18,alignItems:'center',boxShadow:'2px 0 12px #1976d211'}}>
          <h2 style={{fontWeight:700,fontSize:22,marginBottom:32}}>Almacén</h2>
          <Link to="/productos" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Productos</Link>
          <Link to="/lotes" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Lotes</Link>
          <Link to="/stock" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Stock</Link>
          <Link to="/movimientos" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Movimientos</Link>
          <Link to="/fabricacion" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Fabricación</Link>
          <Link to="/bajas-ajustes" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Bajas/Ajustes</Link>
          <Link to="/avisos" style={{color:'#fff',textDecoration:'none',fontWeight:600,fontSize:17}}>Avisos</Link>
        </nav>
        <main style={{flex:1,padding:'32px 0'}}>
          <Routes>
            <Route path="/productos" element={<ProductosPanel />} />
            <Route path="/lotes" element={<LotesPanel />} />
            <Route path="/stock" element={<StockPanel />} />
            <Route path="/movimientos" element={<MovimientosStockPanel />} />
            <Route path="/fabricacion" element={<FabricacionPanel />} />
            <Route path="/bajas-ajustes" element={<BajasAjustesPanel />} />
            <Route path="/avisos" element={<AvisosPanel rolUsuario={rolUsuario} />} />
            <Route path="*" element={<Navigate to="/productos" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

// Ejemplo de integración temporal para pruebas
// Puedes añadir una ruta o botón en tu menú principal para acceder a <ProductosPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <LotesPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <StockPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <MovimientosStockPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <FabricacionPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <BajasAjustesPanel />
// Puedes añadir una ruta o botón en tu menú principal para acceder a <AvisosPanel />
