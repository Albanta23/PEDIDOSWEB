import React, { useState, useEffect } from 'react';
import './App.css';
import FabricaPanel from './components/FabricaPanel';
import Login from './components/Login';
import PedidoForm from './components/PedidoForm';
import PedidoList from './components/PedidoList';
import HistoricoTienda from './components/HistoricoTienda';
import ErrorLogger from './components/ErrorLogger';
import HistoricoFabrica from './components/HistoricoFabrica';
import HistoricoTiendaPanel from './components/HistoricoTiendaPanel';
import SeleccionModo from './components/SeleccionModo';
import { abrirHistoricoEnVentana } from './utils/historicoVentana';
import { io } from 'socket.io-client';

// Conexión a socket.io en Render
const socket = io('https://pedidos-backend-0e1s.onrender.com');

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

function generarIdUnico() {
  return 'pedido_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function cargarPedidosPersistidos() {
  try {
    const pedidosGuardados = localStorage.getItem('pedidos');
    if (!pedidosGuardados) return [];
    const pedidos = JSON.parse(pedidosGuardados);
    if (!Array.isArray(pedidos)) throw new Error('Formato inválido');
    return pedidos;
  } catch (e) {
    localStorage.removeItem('pedidos');
    return [];
  }
}

function guardarPedidos(pedidos) {
  localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

function App() {
  const [pedidos, setPedidos] = useState(() => cargarPedidosPersistidos());
  const [modo, setModo] = useState(null); // null, 'fabrica', 'tienda'
  const [logueado, setLogueado] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(null);
  const [mostrarHistoricoFabrica, setMostrarHistoricoFabrica] = useState(false);
  const [mostrarHistoricoTienda, setMostrarHistoricoTienda] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);

  // --- ESTADO PARA FEEDBACK UX ---
  const [mensaje, setMensaje] = useState(null);

  // --- FEEDBACK TEMPORAL ---
  function mostrarMensaje(texto, tipo = 'info', duracion = 2500) {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje(null), duracion);
  }

  useEffect(() => {
    guardarPedidos(pedidos);
  }, [pedidos]);

  useEffect(() => {
    // Escuchar eventos de pedidos en tiempo real
    socket.on('pedido_nuevo', (pedido) => {
      setPedidos(prev => [...prev, pedido]);
    });
    socket.on('pedido_actualizado', (pedidoActualizado) => {
      setPedidos(prev => prev.map(p => p.id === pedidoActualizado.id ? pedidoActualizado : p));
    });
    socket.on('pedido_eliminado', (pedidoEliminado) => {
      setPedidos(prev => prev.filter(p => p.id !== pedidoEliminado.id));
    });
    socket.on('pedidos_inicial', (pedidosIniciales) => {
      setPedidos(pedidosIniciales);
    });
    return () => {
      socket.off('pedido_nuevo');
      socket.off('pedido_actualizado');
      socket.off('pedido_eliminado');
      socket.off('pedidos_inicial');
    };
  }, []);

  const cambiarEstadoPedido = (pedidoId, nuevoEstado) => {
    setPedidos(pedidosAnteriores => {
      const actualizados = pedidosAnteriores.map((p) =>
        p.id === pedidoId
          ? {
              ...p,
              estado: nuevoEstado,
              ...(nuevoEstado === 'preparado' ? { fechaEnvio: new Date().toISOString() } : {}),
              ...(nuevoEstado === 'enviadoTienda' ? { fechaRecepcion: new Date().toISOString() } : {})
            }
          : p
      );
      guardarPedidos(actualizados);
      if (nuevoEstado === 'preparado') mostrarMensaje('Pedido preparado', 'success');
      if (nuevoEstado === 'enviadoTienda') mostrarMensaje('Pedido enviado a tienda', 'success');
      return actualizados;
    });
  };

  const cambiarEstadoLinea = (pedidoId, idxLinea, preparada) => {
    setPedidos(pedidosAnteriores => {
      const actualizados = pedidosAnteriores.map(p => {
        if (p.id !== pedidoId) return p;
        return {
          ...p,
          lineas: p.lineas.map((l, idx) => idx === idxLinea ? { ...l, preparada } : l)
        };
      });
      guardarPedidos(actualizados);
      return actualizados;
    });
  };

  // Permite editar detalles de línea: cantidadEnviada y lote
  const cambiarEstadoLineaDetalle = (pedidoId, idxLinea, cambios) => {
    setPedidos(pedidosAnteriores => {
      const actualizados = pedidosAnteriores.map(p => {
        if (p.id !== pedidoId) return p;
        return {
          ...p,
          lineas: p.lineas.map((l, idx) => idx === idxLinea ? { ...l, ...cambios } : l)
        };
      });
      guardarPedidos(actualizados);
      return actualizados;
    });
  };

  const handleLogin = (usuario, tiendaId) => {
    setLogueado(true);
    if (modo === 'tienda') setTiendaSeleccionada(tiendaId);
  };

  const agregarPedido = (pedido) => {
    setPedidos(prev => {
      const nuevo = {
        id: generarIdUnico(),
        tiendaId: tiendaSeleccionada,
        estado: 'borrador',
        lineas: [
          {
            producto: pedido.producto,
            cantidad: pedido.cantidad,
            formato: pedido.formato,
            comentario: pedido.comentario
          }
        ]
      };
      const actualizados = [...prev, nuevo];
      guardarPedidos(actualizados);
      mostrarMensaje('Pedido añadido al borrador', 'success');
      return actualizados;
    });
  };

  const modificarPedido = (idx, nuevoPedido) => {
    setPedidos(pedidosAnteriores => {
      const actualizados = pedidosAnteriores.map((p, i) =>
        i === idx ? { ...p, ...nuevoPedido } : p
      );
      guardarPedidos(actualizados);
      return actualizados;
    });
  };

  const borrarPedido = (idx) => {
    setPedidos(pedidosAnteriores => {
      const actualizados = pedidosAnteriores.filter((_, i) => i !== idx);
      guardarPedidos(actualizados);
      mostrarMensaje('Pedido borrado', 'info');
      return actualizados;
    });
  };

  const enviarPedidosAFabrica = () => {
    const fechaPedido = new Date().toISOString();
    const pedidosBorrador = pedidos.filter(p => p.tiendaId === tiendaSeleccionada && p.estado === 'borrador');
    if (pedidosBorrador.length === 0) {
      mostrarMensaje('No hay pedidos en borrador para enviar', 'warning');
      return;
    }
    const ultimoNumero = pedidos.reduce(
      (max, p) => (p.numeroPedido && p.numeroPedido > max ? p.numeroPedido : max),
      0
    );
    const nuevoNumero = ultimoNumero + 1;
    const todasLasLineas = pedidosBorrador.flatMap(p => p.lineas).map(l => ({ ...l, preparada: false }));
    const pedidoAgrupado = {
      id: generarIdUnico(),
      tiendaId: tiendaSeleccionada,
      estado: 'enviado',
      fechaPedido,
      numeroPedido: nuevoNumero,
      lineas: todasLasLineas
    };
    setPedidos(prevPedidos => {
      const restantes = prevPedidos.filter(p => !(p.tiendaId === tiendaSeleccionada && p.estado === 'borrador'));
      const actualizados = [...restantes, pedidoAgrupado];
      guardarPedidos(actualizados);
      mostrarMensaje('Pedidos enviados a fábrica', 'success');
      return actualizados;
    });
  };

  function handleEditarPedido(pedido) {
    setPedidoEditando(pedido);
  }

  if (!modo) {
    return <SeleccionModo onSeleccion={setModo} />;
  }

  if (!logueado) {
    return (
      <div className="App">
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
            onVolver={() => setMostrarHistoricoTienda(false)}
            onModificarPedido={(pedidoEditado) => {
              setPedidos(prev => prev.map(p => p.id === pedidoEditado.id ? pedidoEditado : p));
              guardarPedidos(pedidos.map(p => p.id === pedidoEditado.id ? pedidoEditado : p));
              mostrarMensaje('Pedido actualizado', 'success');
            }}
          />
        ) : (
          <div>
            <PedidoForm
              pedido={pedidoEditando}
              onAdd={agregarPedido}
            />
            <PedidoList
              pedidos={pedidos.filter(p => p.tiendaId === tiendaSeleccionada)}
              onModificar={modificarPedido}
              onBorrar={borrarPedido}
              onEditar={handleEditarPedido}
              modo={"tienda"}
            />
            <button onClick={enviarPedidosAFabrica}>Enviar pedidos a fábrica</button>
            <button onClick={() => setMostrarHistoricoTienda(true)} style={{marginLeft:12,background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:500}}>Ver histórico de pedidos</button>
          </div>
        )
      )}
      <ErrorLogger />
    </div>
  );
}

export default App;
