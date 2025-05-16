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
import { obtenerPedidos, crearPedido, actualizarPedido, eliminarPedido } from './services/pedidosService';

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

function App() {
  const [pedidos, setPedidos] = useState([]);
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
    const fetchPedidos = async () => {
      try {
        const data = await obtenerPedidos();
        setPedidos(data);
      } catch (error) {
        setMensaje({ texto: 'Error al cargar pedidos', tipo: 'warning' });
      }
    };
    fetchPedidos();
  }, []);

  // Cambia el estado de un pedido y lo persiste en MongoDB
  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const pedido = pedidos.find(p => p.id === pedidoId || p._id === pedidoId);
      if (!pedido) return;
      const actualizado = {
        ...pedido,
        estado: nuevoEstado,
        ...(nuevoEstado === 'preparado' ? { fechaEnvio: new Date().toISOString() } : {}),
        ...(nuevoEstado === 'enviadoTienda' ? { fechaRecepcion: new Date().toISOString() } : {})
      };
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
      const nuevasLineas = pedido.lineas.map((l, idx) => idx === idxLinea ? { ...l, ...cambios } : l);
      const actualizado = { ...pedido, lineas: nuevasLineas };
      await actualizarPedido(pedido._id || pedido.id, actualizado);
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (error) {
      mostrarMensaje('Error al actualizar línea', 'warning');
    }
  };

  const handleLogin = (usuario, tiendaId) => {
    setLogueado(true);
    if (modo === 'tienda' ) setTiendaSeleccionada(tiendaId);
  };

  const agregarPedido = async (pedido) => {
    try {
      await crearPedido({ ...pedido, tiendaId: tiendaSeleccionada });
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
