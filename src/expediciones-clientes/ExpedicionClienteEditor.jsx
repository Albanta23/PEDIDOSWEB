import React, { useState, useEffect, useRef } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { actualizarPedidoCliente } from './pedidosClientesExpedicionService';

export default function ExpedicionClienteEditor({ pedido, onClose, onActualizado }) {
  const [lineas, setLineas] = useState([]);
  const [estado, setEstado] = useState(pedido.estado || 'pendiente');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editado, setEditado] = useState(false);
  const lineasRef = useRef();

  useEffect(() => {
    if (pedido && Array.isArray(pedido.lineas)) {
      setLineas(pedido.lineas.map(l => ({ ...l })));
      setEditado(false);
      setEstado(pedido.estado || 'pendiente');
    } else {
      setLineas([]);
      setEditado(false);
      setEstado('pendiente');
    }
  }, [pedido]);

  // Detectar edición de líneas
  const actualizarLinea = (idx, campo, valor) => {
    setLineas(prev => {
      const nuevas = prev.map((l, i) => i === idx ? { ...l, [campo]: valor } : l);
      setEditado(true);
      // Si el estado no es en_preparacion, cambiarlo automáticamente
      if (estado !== 'en_preparacion') setEstado('en_preparacion');
      return nuevas;
    });
  };
  const borrarLinea = idx => setLineas(prev => {
    setEditado(true);
    return prev.filter((_, i) => i !== idx);
  });
  const addLinea = () => {
    setEditado(true);
    setLineas(prev => [...prev, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '' }]);
  };
  const addComentario = () => {
    setEditado(true);
    setLineas(prev => [...prev, { esComentario: true, comentario: '' }]);
  };

  // Guardar cambios (pasa a EN PREPARACION)
  async function handleGuardar() {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await actualizarPedidoCliente(pedido._id || pedido.id, { lineas, estado: 'en_preparacion', usuarioTramitando: window?.usuarioExpediciones || 'expediciones' });
      setMensaje('Guardado correctamente');
      setEstado('en_preparacion');
      setEditado(false);
      if (onActualizado) onActualizado();
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setError('Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  // Cerrar pedido (pasa a PREPARADO)
  async function handleCerrar() {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await actualizarPedidoCliente(pedido._id || pedido.id, { lineas, estado: 'preparado', usuarioTramitando: window?.usuarioExpediciones || 'expediciones' });
      setMensaje('Pedido cerrado y preparado');
      setEstado('preparado');
      setEditado(false);
      if (onActualizado) onActualizado();
      setTimeout(() => {
        setMensaje('');
        onClose();
      }, 1200);
    } catch {
      setError('Error al cerrar el pedido');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 2px 12px #0001', background: '#fff', position: 'relative', padding: 0, maxWidth: '100vw', minWidth: 0 }}>
      <div style={{ position: 'absolute', top: 18, left: 18, zIndex: 2, display: 'flex', gap: 12 }}>
        <button style={{ background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }} onClick={editado ? handleGuardar : undefined} disabled={guardando || !editado}>Guardar</button>
        <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }} onClick={handleCerrar} disabled={guardando || estado === 'preparado'}>Cerrar pedido</button>
        <button style={{ background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, marginLeft: 12 }} onClick={onClose}>Cerrar ventana</button>
      </div>
      <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 2, display: 'flex', gap: 12 }}>
        <button style={{ background: '#00c6ff', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, marginBottom: 0 }} onClick={addLinea}>Añadir línea de producto</button>
        <button style={{ background: '#6c757d', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, marginBottom: 0 }} onClick={addComentario}>Añadir comentario</button>
      </div>
      <h3 style={{ margin: '32px 0 18px 0', textAlign: 'center' }}>Editar Pedido Nº {pedido.numeroPedido || pedido.id}</h3>
      <div style={{ marginBottom: 12, textAlign: 'center' }}><b>Cliente:</b> {pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || '-'}</div>
      <div style={{ marginBottom: 12, textAlign: 'center' }}><b>Dirección:</b> {pedido.direccion || pedido.direccionEnvio || '-'}</div>
      <div style={{ marginBottom: 12, textAlign: 'center', fontWeight: 600, color: estado === 'en_espera' ? '#d32f2f' : estado === 'en_preparacion' ? '#388e3c' : estado === 'preparado' ? '#1976d2' : '#1976d2' }}>
        Estado actual: {estado === 'en_espera' ? 'EN ESPERA' : estado === 'en_preparacion' ? 'EN PREPARACIÓN' : estado === 'preparado' ? 'PREPARADO' : estado}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18 }}>
        <thead>
          <tr style={{ background: '#f4f6fa' }}>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Producto</th>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Cantidad</th>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Formato</th>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Peso (kg)</th>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Comentario</th>
            <th style={{ padding: 6, border: '1px solid #eee' }}>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {lineas.length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Sin líneas</td></tr>
          )}
          {lineas.map((l, idx) => l.esComentario ? (
            <tr key={`comment-${idx}`} style={{ backgroundColor: '#fffbe6', border: '2px solid #ffe58f' }}>
              <td colSpan={6} style={{ padding: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 'bold', color: '#b8860b', fontSize: 16 }}>📝 COMENTARIO:</span>
                  <input
                    type="text"
                    value={l.comentario || ''}
                    onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                    placeholder="Escribe aquí tu comentario..."
                    style={{ width: '100%', border: '1px dashed #b8860b', borderRadius: 6, padding: '8px 12px', background: '#fffdf7', fontStyle: 'italic', fontSize: 15, color: '#b8860b', minWidth: 0, boxSizing: 'border-box' }}
                  />
                  <button style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 14, alignSelf: 'flex-end' }} onClick={() => borrarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={idx}>
              <td>
                <input
                  value={l.producto}
                  onChange={e => actualizarLinea(idx, 'producto', e.target.value)}
                  placeholder="Producto"
                  style={{ width: '100%', minWidth: 0, border: '1px solid #bbb', borderRadius: 6, padding: '6px 8px', fontSize: 15, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="1"
                  value={l.cantidad}
                  onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <select value={l.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)} style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  {FORMATOS_PEDIDO.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.peso || ''}
                  onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                  placeholder="Peso (kg)"
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={l.comentario === null || l.comentario === undefined ? '' : l.comentario}
                  onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <button style={{ background: '#dc3545', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontWeight: 600, cursor: 'pointer' }} onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {mensaje && <div style={{ color: '#1976d2', marginBottom: 12, textAlign: 'center' }}>{mensaje}</div>}
      {error && <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>{error}</div>}
    </div>
  );
}
