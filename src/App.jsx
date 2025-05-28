import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
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

  const handleLogin = (usuario, tiendaId) => {
    setLogueado(true);
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
    <div className="App">
      <Watermark />
      {mensaje && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: mensaje.tipo === 'success' ? '#28a745' : mensaje.tipo === 'warning' ? '#ffc107' : '#007bff',
          color: mensaje.tipo === 'success' ? '#fff' : mensaje.tipo === 'warning' ? '#212529' : '#fff',
          padding: '14px 36px', borderRadius: 10, boxShadow: '0 2px 12px #aaa', zIndex: 1000,
          fontWeight: 600, fontSize: 18, letterSpacing: 0.5,
          border: mensaje.tipo === 'success' ? '2px solid #218838' : mensaje.tipo === 'warning' ? '2px solid #ffecb5' : '2px solid #0056b3',
          minWidth: 320, textAlign: 'center',
          textShadow: mensaje.tipo === 'success' ? '0 1px 2px #155724' : mensaje.tipo === 'warning' ? '0 1px 2px #856404' : '0 1px 2px #004085'
        }}>
          {mensaje.texto}
        </div>
      )}
      {modo === 'tienda' && logueado && !mostrarHistoricoTienda && avisos.length > 0 && (
        <div style={{
          position: 'fixed', top: 90, left: '50%', transform: 'translateX(-50%)', zIndex: 3000,
          display: 'flex', flexDirection: 'column', gap: 10, minWidth: 320, maxWidth: 600, width: '90vw',
        }}>
          {avisos.map(aviso => (
            <div key={aviso.id} style={{
              background: aviso.tipo === 'pedido' ? '#28a745' : '#007bff',
              color: '#fff',
              borderRadius: 10,
              boxShadow: '0 2px 12px #aaa',
              padding: '14px 24px',
              fontWeight: 600,
              fontSize: 17,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '2px solid #218838',
              cursor: 'pointer',
            }}
            >
              <span>{aviso.texto}</span>
              <button
                style={{marginLeft:18,background:'#fff',color:aviso.tipo==='pedido'?'#28a745':'#007bff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer',fontSize:15}}
                onClick={e => {
                  e.stopPropagation();
                  setMostrarHistoricoTienda(true);
                }}
              >
                Ver
              </button>
            </div>
          ))}
        </div>
      )}
      {(() => { try { console.log('[FRONTEND] Pedidos pendientes (FabricaPanel):', pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado')); } catch(e){} })()}
      {modo === 'fabrica' ? (
        mostrarHistoricoFabrica ? (
          <HistoricoFabrica
            pedidos={pedidos}
            tiendas={tiendas}
            onVolver={() => setMostrarHistoricoFabrica(false)}
          />
        ) : (
          <FabricaPanel
            pedidos={pedidos}
            tiendas={tiendas}
            onEstadoChange={cambiarEstadoPedido}
            onLineaChange={cambiarEstadoLinea}
            onLineaDetalleChange={cambiarEstadoLineaDetalle}
            onVerHistorico={() => setMostrarHistoricoFabrica(true)}
          />
        )
      ) : (
        mostrarHistoricoTienda ? (
          <HistoricoTiendaPanel
            pedidos={pedidos}
            tiendaId={tiendaSeleccionada}
            tiendaNombre={tiendas.find(t => t.id === tiendaSeleccionada)?.nombre || ''}
            tiendas={tiendas}
            onVolver={() => setMostrarHistoricoTienda(false)}
            onModificarPedido={(pedidoEditado) => {
              setPedidos(prev => prev.map(p => p.id === pedidoEditado.id ? pedidoEditado : p));
              mostrarMensaje('Pedido actualizado', 'success');
            }}
            onAvisoVisto={avisoId => handleAvisoVisto({ id: avisoId })}
          >
            <button
              style={{position:'absolute',top:18,left:18,background:'#007bff',color:'#fff',border:'none',borderRadius:8,padding:'8px 20px',fontWeight:700,fontSize:16,cursor:'pointer',zIndex:2100}}
              onClick={() => setMostrarHistoricoTienda(false)}
            >
              ← Volver
            </button>
          </HistoricoTiendaPanel>
        ) : (
          <div>
            <PedidoList
              pedidos={pedidos.filter(p => p.tiendaId === tiendaSeleccionada)}
              onModificar={modificarPedido}
              onBorrar={borrarPedido}
              onEditar={handleEditarPedido}
              modo={"tienda"}
              tiendaActual={tiendas.find(t => t.id === tiendaSeleccionada)}
            />
            <button onClick={() => setMostrarHistoricoTienda(true)} style={{marginLeft:12,background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:500}}>Ver histórico de pedidos</button>
          </div>
        )
      )}
      <ErrorLogger />
      {modo === 'tienda' && (
        <>
          <div style={{
            position:'fixed',top:60,left:'50%',transform:'translateX(-50%)',background:'#eee',padding:'8px 18px',
            borderRadius:8,fontSize:15,zIndex:2000,color:'#333',boxShadow:'0 1px 6px #bbb',
            minWidth:180, textAlign:'center', fontWeight:600,
            display:'flex', alignItems:'center', justifyContent:'center', gap:16
          }}>
            <span>{tiendas.find(t => t.id === tiendaSeleccionada)?.nombre || ''}</span>
            <button
              onClick={() => {
                setLogueado(false);
                setTiendaSeleccionada(null);
                setMostrarHistoricoTienda(false);
                setPedidoEditando(null);
                setMensaje(null);
              }}
              style={{
                background:'#dc3545', color:'#fff', border:'none', borderRadius:8, padding:'6px 18px', fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 1px 6px #dc354522',
                marginLeft:'auto'
              }}
              title="Cerrar sesión"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
