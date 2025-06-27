import React, { useState, useEffect } from 'react';
import ExpedicionesClientesLogin from './ExpedicionesClientesLogin';
import { obtenerPedidosClientesExpedicion } from './pedidosClientesExpedicionService';
import ExpedicionClienteEditor from './ExpedicionClienteEditor';
import HistorialPedidoCliente from './HistorialPedidoCliente';

export default function ExpedicionesClientes() {
  const [logueado, setLogueado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoHistorial, setPedidoHistorial] = useState(null);

  useEffect(() => {
    if (logueado) {
      setCargando(true);
      obtenerPedidosClientesExpedicion().then(data => {
        setPedidos(data.filter(p => p.tiendaId === 'clientes'));
        setCargando(false);
      }).catch(() => setCargando(false));
    }
  }, [logueado]);

  // Recarga pedidos tras editar/tramitar
  function recargarPedidos() {
    setCargando(true);
    obtenerPedidosClientesExpedicion().then(data => {
      setPedidos(data.filter(p => p.tiendaId === 'clientes'));
      setCargando(false);
    }).catch(() => setCargando(false));
  }

  if (!logueado) {
    return <ExpedicionesClientesLogin onLogin={nombre => { setUsuario(nombre); setLogueado(true); }} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #bbb', padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Expediciones de Pedidos de Clientes</h2>
      <div style={{ marginBottom: 18, color: '#1976d2', fontWeight: 600 }}>Usuario: {usuario}</div>
      {cargando ? (
        <div style={{ color: '#888' }}>Cargando pedidos...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f4f6fa' }}>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Nº Pedido</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Cliente</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Dirección</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Estado</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Acciones</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Historial</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No hay pedidos de clientes para expedición.</td></tr>
            )}
            {pedidos.map(p => (
              <tr key={p._id || p.id}>
                <td style={{ padding: 8, border: '1px solid #eee', fontWeight: 600 }}>{p.numeroPedido || p.id}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.clienteNombre || p.nombreCliente || p.cliente || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.direccion || p.direccionEnvio || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.estado || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setPedidoEditando(p)}>
                    Editar
                  </button>
                </td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  <button style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setPedidoHistorial(p)}>
                    Ver historial
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pedidoEditando && (
        <ExpedicionClienteEditor pedido={pedidoEditando} onClose={() => setPedidoEditando(null)} onActualizado={recargarPedidos} />
      )}
      <HistorialPedidoCliente pedidoId={pedidoHistorial?._id || pedidoHistorial?.id} visible={!!pedidoHistorial} onClose={() => setPedidoHistorial(null)} />
      <div style={{ color: '#888', fontStyle: 'italic' }}>
        (En desarrollo) Aquí aparecerán los pedidos de clientes para tramitar, editar y su historial.
      </div>
    </div>
  );
}
