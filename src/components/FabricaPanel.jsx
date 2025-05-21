import React, { useState } from 'react';
import Watermark from './Watermark';
import TransferenciasPanel from './TransferenciasPanel';
import logo from '../assets/logo1.png';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  const [pedidoAbierto, setPedidoAbierto] = useState(null);
  const [mostrarHistoricoTransferencias, setMostrarHistoricoTransferencias] = useState(false);

  // Paleta de colores para los botones de tienda
  const colores = [
    '#1976d2', '#388e3c', '#fbc02d', '#d32f2f', '#7b1fa2', '#00838f', '#c2185b', '#ffa000', '#455a64', '#5d4037'
  ];

  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado'
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  // Agrupar pedidos por tienda
  const pedidosPorTienda = {};
  pedidosPendientes.forEach(p => {
    if (!pedidosPorTienda[p.tiendaId]) pedidosPorTienda[p.tiendaId] = [];
    pedidosPorTienda[p.tiendaId].push(p);
  });

  // Función para abrir un pedido concreto
  const abrirPedido = (pedido) => {
    setPedidoAbierto({
      ...pedido,
      lineas: pedido.lineas.map(l => ({ ...l }))
    });
  };

  // Función para cerrar el pedido abierto
  const cerrarPedido = () => setPedidoAbierto(null);

  // Función para actualizar una línea editada
  const actualizarLinea = (idx, campo, valor) => {
    setPedidoAbierto(prev => ({
      ...prev,
      lineas: prev.lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l)
    }));
  };

  // Función para borrar una línea
  const borrarLinea = (idx) => {
    setPedidoAbierto(prev => ({
      ...prev,
      lineas: prev.lineas.filter((_, i) => i !== idx)
    }));
  };

  // Guardar edición de un pedido
  const guardarEdicion = async () => {
    const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && l.cantidad);
    if (nuevasLineas.length === 0) {
      await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'eliminar');
      setPedidoAbierto(null);
      return;
    }
    const lineasNormalizadas = nuevasLineas.map(l => ({ ...l, preparada: !!l.preparada }));
    await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
    setPedidoAbierto(null);
  };

  return (
    <div style={{ marginTop: 32 }}>
      <Watermark />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32,marginTop:10}}>
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 75,
            height: 75,
            objectFit: 'contain',
            boxShadow: '0 4px 24px #0002',
            borderRadius: 18,
            background: '#fff',
            padding: 12,
            margin: 0
          }}
        />
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          <button
            onClick={onVerHistorico}
            style={{
              minWidth: 160,
              height: 44,
              background:'#007bff',
              color:'#fff',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #007bff22',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="histórico" style={{marginRight:8}}>📦</span>Historial de envíos
          </button>
          <button
            onClick={()=>setMostrarHistoricoTransferencias(true)}
            style={{
              minWidth: 150,
              height: 44,
              background:'#00b894',
              color:'#fff',
              border:'none',
              borderRadius:12,
              cursor:'pointer',
              fontWeight:700,
              fontSize:17,
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              boxShadow:'0 1px 4px #00b89422',
              padding:'0 18px',
              letterSpacing:0.2
            }}
          >
            <span role="img" aria-label="devoluciones" style={{marginRight:8}}>↩️</span>Devoluciones
          </button>
        </div>
      </div>
      <h2 style={{margin:0}}>Panel de Fábrica</h2>
      {mostrarHistoricoTransferencias && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0008',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:400,maxWidth:900,maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
            <button onClick={()=>setMostrarHistoricoTransferencias(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0}}>Histórico de devoluciones de tiendas</h2>
            <TransferenciasPanel tiendas={tiendas} modoFabrica={true} />
          </div>
        </div>
      )}
      <h3 style={{marginBottom:12,marginTop:24}}>Pedidos pendientes de preparar o enviar</h3>
      {/* Botones de tiendas con pedidos pendientes */}
      <div style={{display:'flex',flexWrap:'wrap',gap:18,marginBottom:32}}>
        {Object.entries(pedidosPorTienda).map(([tiendaId, pedidos], idx) => {
          const tienda = tiendas.find(t => t.id === tiendaId);
          return pedidos.map((pedido, pidx) => {
            // Clave única robusta: id/_id + número de pedido + índice
            const key = `${pedido.id || pedido._id || 'sinid'}-${pedido.numeroPedido || 'nonum'}-${pidx}`;
            return (
              <button
                key={key}
                onClick={() => abrirPedido(pedido)}
                style={{
                  minWidth: 180,
                  minHeight: 90,
                  background: colores[(idx + pidx) % colores.length],
                  color: '#fff',
                  border: 'none',
                  borderRadius: 14,
                  fontWeight: 700,
                  fontSize: 18,
                  margin: 0,
                  boxShadow: '0 2px 8px #bbb',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.1s',
                  outline: 'none',
                  padding: 12
                }}
              >
                <span style={{fontSize:22}}>{tienda?.nombre || tiendaId}</span>
                <span style={{fontSize:14,marginTop:6}}>Nº Pedido: <b>{pedido.numeroPedido}</b></span>
                <span style={{fontSize:13,marginTop:2}}>Líneas: {pedido.lineas.length}</span>
              </button>
            );
          });
        })}
      </div>
      {/* Edición del pedido abierto */}
      {pedidoAbierto && (
        <div style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
          <h3>
            {tiendas.find(t => t.id === pedidoAbierto.tiendaId)?.nombre || pedidoAbierto.tiendaId} - Nº Pedido: {pedidoAbierto.numeroPedido}
          </h3>
          <div>Fecha: {pedidoAbierto.fechaPedido ? new Date(pedidoAbierto.fechaPedido).toLocaleString() : '-'}</div>
          <div style={{ marginTop: 12 }}>
            Estado: <b>{estados[pedidoAbierto.estado] || pedidoAbierto.estado}</b>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{fontWeight:600,marginRight:8}}>Peso total (kg):</label>
            <input
              type="number"
              min="0"
              step="any"
              value={pedidoAbierto.peso ?? ''}
              onChange={e => setPedidoAbierto(prev => ({ ...prev, peso: e.target.value }))}
              style={{ width: 100, fontSize:16, padding:4, borderRadius:6, border:'1px solid #ccc' }}
            />
          </div>
          <div style={{ marginTop: 12, display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={cerrarPedido} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Cancelar</button>
          </div>
          <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginTop: 12 }}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant. pedida</th>
                <th>Cant. enviada</th>
                <th>Formato pedido</th>
                <th>Comentario</th>
                <th>Lote</th>
                <th>Preparada</th>
                <th>Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {pedidoAbierto.lineas.map((linea, idx) => (
                <tr key={idx}>
                  <td>{linea.producto}</td>
                  <td>{linea.cantidad}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={linea.cantidadEnviada ?? ''}
                      onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                      style={{ width: 70 }}
                    />
                  </td>
                  <td>{linea.formato}</td>
                  <td>{linea.comentario}</td>
                  <td>
                    <input
                      type="text"
                      value={linea.lote ?? ''}
                      onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                      style={{ width: 90 }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!linea.preparada}
                      onChange={e => actualizarLinea(idx, 'preparada', e.target.checked)}
                    />
                  </td>
                  <td>
                    <button
                      style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                      onClick={() => borrarLinea(idx)}
                      title="Eliminar línea"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
              {/* Botones Guardar y Enviar pedido al final de la tabla */}
              <tr>
                <td colSpan="8" style={{textAlign:'right', paddingTop:16}}>
                  <button
                    style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}}
                    onClick={async () => {
                      const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && l.cantidad);
                      if (nuevasLineas.length === 0) return;
                      const lineasNormalizadas = nuevasLineas.map(l => ({ ...l, preparada: !!l.preparada }));
                      await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                    }}
                  >
                    Guardar
                  </button>
                  <button
                    style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}}
                    onClick={async () => {
                      const nuevasLineas = pedidoAbierto.lineas.filter(l => l.producto && l.cantidad);
                      if (nuevasLineas.length === 0) {
                        await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'eliminar');
                        setPedidoAbierto(null);
                        return;
                      }
                      const lineasNormalizadas = nuevasLineas.map(l => ({ ...l, preparada: !!l.preparada }));
                      await onLineaDetalleChange(pedidoAbierto._id || pedidoAbierto.id, null, lineasNormalizadas);
                      await onEstadoChange(pedidoAbierto._id || pedidoAbierto.id, 'enviadoTienda');
                      setPedidoAbierto(null);
                    }}
                  >
                    Enviar pedido
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FabricaPanel;