import React, { useState, useEffect } from 'react';
import ExpedicionesClientesLogin from './ExpedicionesClientesLogin';
import { obtenerPedidosClientesExpedicion, borrarPedidoCliente } from './pedidosClientesExpedicionService';
import ExpedicionClienteEditor from './ExpedicionClienteEditor';
import { ProductosProvider } from '../components/ProductosContext';
import { ProductosSageProvider } from '../clientes-gestion/components/ProductosSageContext';
import HistorialPedidosClientes from '../clientes-gestion/HistorialPedidosClientes';
import HistorialDevoluciones from '../clientes-gestion/HistorialDevoluciones';
import { exportExpedicionClientePDF } from './exportExpedicionPDF';

export default function ExpedicionesClientes() {
  const [logueado, setLogueado] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [mostrarHistorialGlobal, setMostrarHistorialGlobal] = useState(false);
  const [mostrarHistorialDevoluciones, setMostrarHistorialDevoluciones] = useState(false);

  useEffect(() => {
    if (logueado) {
      setCargando(true);
      obtenerPedidosClientesExpedicion().then(data => {
        // Filtrar: no en historial devoluciones, no pendientes de confirmación, no enviados, no entregados, no preparados, no borradores de woocommerce
        const pedidosFiltrados = data.filter(p => {
          const estado = (p.estado || '').toLowerCase();
          return !p.enHistorialDevoluciones && 
                 estado !== 'pendiente_confirmacion' && 
                 estado !== 'enviado' && 
                 estado !== 'entregado' &&
                 estado !== 'preparado' &&
                 estado !== 'borrador_woocommerce';
        });
        setPedidos(pedidosFiltrados);
        setCargando(false);
      }).catch(() => setCargando(false));

      // Configurar recarga automática cada 30 segundos
      const intervalId = setInterval(() => {
        obtenerPedidosClientesExpedicion().then(data => {
          // Filtrar: no en historial devoluciones, no pendientes de confirmación, no enviados, no entregados, no preparados, no borradores de woocommerce
          const pedidosFiltrados = data.filter(p => {
            const estado = (p.estado || '').toLowerCase();
            return !p.enHistorialDevoluciones && 
                   estado !== 'pendiente_confirmacion' && 
                   estado !== 'enviado' && 
                   estado !== 'entregado' &&
                   estado !== 'preparado' &&
                   estado !== 'borrador_woocommerce';
          });
          setPedidos(pedidosFiltrados);
        });
      }, 30000);

      return () => clearInterval(intervalId); // Limpiar intervalo al desmontar
    }
  }, [logueado]);

  // Recarga pedidos tras editar/tramitar
  function recargarPedidos() {
    setCargando(true);
    obtenerPedidosClientesExpedicion().then(data => {
      // Filtrar: no en historial devoluciones, no pendientes de confirmación, no enviados, no entregados, no preparados, no borradores de woocommerce
      const pedidosFiltrados = data.filter(p => {
        const estado = (p.estado || '').toLowerCase();
        return !p.enHistorialDevoluciones && 
               estado !== 'pendiente_confirmacion' && 
               estado !== 'enviado' && 
               estado !== 'entregado' &&
               estado !== 'preparado' &&
               estado !== 'borrador_woocommerce';
      });
      setPedidos(pedidosFiltrados);
      setCargando(false);
    }).catch(() => setCargando(false));
  }

  async function handleBorrarPedido(id) {
    if (window.confirm('¿Seguro que quieres borrar este pedido?')) {
      await borrarPedidoCliente(id);
      recargarPedidos();
    }
  }

  if (!logueado) {
    return <ExpedicionesClientesLogin onLogin={nombre => { setUsuario(nombre); setLogueado(true); window.usuarioExpediciones = nombre; }} />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px #bbb', padding: 32 }}>
      <div style={{display:'flex',alignItems:'center',gap:18,marginBottom:24}}>
        <h2 style={{ margin: 0, flex:1 }}>Expediciones de Pedidos de Clientes</h2>
        <button onClick={()=>setMostrarHistorialGlobal(m=>!m)} style={{padding:'10px 22px',border:'none',borderRadius:8,background:mostrarHistorialGlobal?'#1976d2':'#fff',color:mostrarHistorialGlobal?'#fff':'#1976d2',fontWeight:700,fontSize:16,boxShadow:'0 1px 4px #1976d222'}}>Historial pedidos clientes</button>
        <button onClick={()=>setMostrarHistorialDevoluciones(m=>!m)} style={{padding:'10px 22px',border:'none',borderRadius:8,background:mostrarHistorialDevoluciones?'#1976d2':'#fff',color:mostrarHistorialDevoluciones?'#fff':'#1976d2',fontWeight:700,fontSize:16,boxShadow:'0 1px 4px #1976d222'}}>Historial devoluciones</button>
      </div>
      <div style={{ marginBottom: 18, color: '#1976d2', fontWeight: 600 }}>Usuario: {usuario}</div>
      {mostrarHistorialDevoluciones ? (
        <HistorialDevoluciones />
      ) : mostrarHistorialGlobal ? (
        <HistorialPedidosClientes soloPreparados />
      ) : cargando ? (
        <div style={{ color: '#888' }}>Cargando pedidos...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ background: '#f4f6fa' }}>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Nº Pedido</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Cliente</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Dirección</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Estado</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Origen</th>
              <th style={{ padding: 8, border: '1px solid #eee' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No hay pedidos de clientes para expedición.</td></tr>
            )}
            {pedidos.map(p => (
              <tr key={p._id || p.id} style={{ background: p.origen?.tipo === 'woocommerce' ? '#ffeb3b' : 'transparent' }}>
                <td style={{ padding: 8, border: '1px solid #eee', fontWeight: 600 }}>{p.numeroPedido || p.id}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.clienteNombre || p.nombreCliente || p.cliente || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.direccion || p.direccionEnvio || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>{p.estado || '-'}</td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  {p.origen?.tipo === 'woocommerce' ? 'WooCommerce' : 'Manual'}
                </td>
                <td style={{ padding: 8, border: '1px solid #eee' }}>
                  <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
                    onClick={() => setPedidoEditando(p)}>
                    Editar
                  </button>
                  <button style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer', marginRight: 8 }}
                    onClick={() => handleBorrarPedido(p._id || p.id)}>
                    Borrar
                  </button>
                  <button style={{ background: '#ffc107', color: '#333', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => exportExpedicionClientePDF(p, usuario)}>
                    Exportar PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pedidoEditando && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(30, 41, 59, 0.85)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: '98vw',
            height: '98vh',
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px #0005',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <button onClick={() => setPedidoEditando(null)} style={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 999,
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: 50,  // Botón circular
              padding: '10px',
              width: '40px',
              height: '40px',
              fontWeight: 700,
              fontSize: 18,
              boxShadow: '0 2px 8px #0002',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>✕</button>
            <div style={{flex:1, minHeight:0, minWidth:0, paddingTop: 32}}>
              {/* ProductosProvider corregido - no necesita ProductosSageProvider */}
              <ProductosProvider>
                <ExpedicionClienteEditor 
                  pedido={pedidoEditando} 
                  usuario={usuario} 
                  onClose={() => setPedidoEditando(null)} 
                  onActualizado={recargarPedidos} 
                />
              </ProductosProvider>
            </div>
          </div>
        </div>
      )}
      <div style={{ color: '#888', fontStyle: 'italic' }}>
        Desarrollado por JCF2025DV
      </div>
    </div>
  );
}
