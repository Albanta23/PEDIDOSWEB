import React, { useState } from 'react';
import Watermark from './Watermark';

const estados = {
  enviado: 'Enviado a fábrica',
  preparado: 'Preparado',
  enviadoTienda: 'Enviado a tienda'
};

const FabricaPanel = ({ pedidos, tiendas, onEstadoChange, onLineaChange, onLineaDetalleChange, onVerHistorico }) => {
  const [edicionPedidos, setEdicionPedidos] = useState({}); // { [pedidoId]: { lineas: [...], editando: bool } }

  // Función para iniciar edición de un pedido
  const iniciarEdicion = (pedido) => {
    setEdicionPedidos(prev => ({
      ...prev,
      [pedido.id]: {
        lineas: pedido.lineas.map(l => ({ ...l })),
        editando: true
      }
    }));
  };

  // Función para cancelar edición de un pedido
  const cancelarEdicion = (pedidoId) => {
    setEdicionPedidos(prev => ({
      ...prev,
      [pedidoId]: undefined
    }));
  };

  // Función para actualizar una línea editada
  const actualizarLinea = (pedidoId, idx, campo, valor) => {
    setEdicionPedidos(prev => ({
      ...prev,
      [pedidoId]: {
        ...prev[pedidoId],
        lineas: prev[pedidoId].lineas.map((l, i) => i === idx ? { ...l, [campo]: valor } : l)
      }
    }));
  };

  // Función para borrar una línea
  const borrarLinea = (pedidoId, idx) => {
    setEdicionPedidos(prev => {
      const nuevasLineas = prev[pedidoId].lineas.filter((_, i) => i !== idx);
      // Si no quedan líneas, elimina el pedido de la edición (y se eliminará al guardar)
      if (nuevasLineas.length === 0) {
        return { ...prev, [pedidoId]: { ...prev[pedidoId], lineas: [] } };
      }
      return {
        ...prev,
        [pedidoId]: {
          ...prev[pedidoId],
          lineas: nuevasLineas
        }
      };
    });
  };

  // Guardar edición de un pedido
  const guardarEdicion = async (pedido) => {
    const edicion = edicionPedidos[pedido.id];
    const nuevasLineas = edicion.lineas.filter(l => l.producto && l.cantidad);
    if (nuevasLineas.length === 0) {
      await onEstadoChange(pedido.id, 'eliminar');
      setEdicionPedidos(prev => ({ ...prev, [pedido.id]: undefined }));
      return;
    }
    const lineasNormalizadas = nuevasLineas.map(l => ({ ...l, preparada: !!l.preparada }));
    await onLineaDetalleChange(pedido.id, null, lineasNormalizadas);
    setEdicionPedidos(prev => ({ ...prev, [pedido.id]: undefined }));
  };

  // Pedidos pendientes: solo los que están en 'enviado' o 'preparado'
  const pedidosPendientes = pedidos.filter(p => p.estado === 'enviado' || p.estado === 'preparado');

  // Agrupar pedidos para mostrar resumen
  const resumenPedidos = pedidosPendientes.map(p => ({
    id: p.id,
    numeroPedido: p.numeroPedido,
    fechaPedido: p.fechaPedido,
    tienda: tiendas.find(t => t.id === p.tiendaId)?.nombre || p.tiendaId,
    cantidadLineas: p.lineas.length,
    estado: p.estado,
    pedido: p
  }));

  return (
    <div style={{ marginTop: 32 }}>
      <Watermark />
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{margin:0}}>Panel de Fábrica</h2>
        <button onClick={onVerHistorico} style={{padding:'8px 18px',background:'#007bff',color:'#fff',border:'none',borderRadius:6,cursor:'pointer',fontWeight:500}}>
          Ver histórico de envíos
        </button>
      </div>
      <h3 style={{marginBottom:12,marginTop:24}}>Pedidos pendientes de preparar o enviar</h3>
      {resumenPedidos.length === 0 ? (
        <p>No hay pedidos pendientes de tiendas.</p>
      ) : (
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', marginTop: 12, marginBottom: 32 }}>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Fecha</th>
              <th>Tienda</th>
              <th>Cant. líneas</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resumenPedidos.map(res => {
              const edicion = edicionPedidos[res.id];
              const enEdicion = !!edicion && edicion.editando;
              return (
                <tr key={res.id}>
                  <td>{res.numeroPedido}</td>
                  <td>{res.fechaPedido ? new Date(res.fechaPedido).toLocaleString() : '-'}</td>
                  <td>{res.tienda}</td>
                  <td>{res.cantidadLineas}</td>
                  <td>{estados[res.estado] || res.estado}</td>
                  <td>
                    {res.estado === 'enviado' && !enEdicion && (
                      <button
                        onClick={() => iniciarEdicion(res.pedido)}
                        style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:600}}
                      >
                        Tramitar pedido
                      </button>
                    )}
                    {enEdicion && (
                      <button
                        onClick={() => cancelarEdicion(res.id)}
                        style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontWeight:600, marginLeft: 6}}
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {/* Renderizado de pedidos en edición (solo el seleccionado) */}
      {resumenPedidos.map(res => {
        const edicion = edicionPedidos[res.id];
        const enEdicion = !!edicion && edicion.editando;
        if (!enEdicion) return null;
        const pedido = res.pedido;
        const lineasMostrar = edicion.lineas;
        // Si no hay líneas, no mostrar la tabla ni el pedido
        if (!lineasMostrar || lineasMostrar.length === 0) return null;
        return (
          <div key={pedido.id} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
            <h3>
              {res.tienda} - Nº Pedido: {pedido.numeroPedido}
            </h3>
            <div>Fecha: {pedido.fechaPedido ? new Date(pedido.fechaPedido).toLocaleString() : '-'}</div>
            <div style={{ marginTop: 12 }}>
              Estado: <b>{estados[pedido.estado] || pedido.estado}</b>
            </div>
            <div style={{ marginTop: 12, display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => guardarEdicion(pedido)} style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Guardar</button>
              <button onClick={() => cancelarEdicion(pedido.id)} style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:600}}>Cancelar</button>
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
                {lineasMostrar.map((linea, idx) => (
                  <tr key={idx}>
                    <td>{linea.producto}</td>
                    <td>{linea.cantidad}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={linea.cantidadEnviada ?? ''}
                        onChange={e => actualizarLinea(pedido.id, idx, 'cantidadEnviada', e.target.value)}
                        style={{ width: 70 }}
                      />
                    </td>
                    <td>{linea.formato}</td>
                    <td>{linea.comentario}</td>
                    <td>
                      <input
                        type="text"
                        value={linea.lote ?? ''}
                        onChange={e => actualizarLinea(pedido.id, idx, 'lote', e.target.value)}
                        style={{ width: 90 }}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!linea.preparada}
                        onChange={e => actualizarLinea(pedido.id, idx, 'preparada', e.target.checked)}
                      />
                    </td>
                    <td>
                      <button
                        style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}}
                        onClick={() => borrarLinea(pedido.id, idx)}
                        title="Eliminar línea"
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default FabricaPanel;