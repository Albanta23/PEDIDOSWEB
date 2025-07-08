import React, { useState, useEffect } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';

export default function PedidoEditorFabrica({ pedido, onSave, onSend, onCancel, tiendas, tiendaNombre, onLineaDetalleChange, onEstadoChange, onAbrirModalPeso, onChange, onRecargarPedidos }) {
  const { productos } = useProductos();
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  // Nuevo estado para mostrar confirmación de guardado/enviado
  const [confirmacion, setConfirmacion] = useState("");
  // Estado para detectar y mostrar si se eliminó un borrador corrupto
  const [borradorCorruptoEliminado, setBorradorCorruptoEliminado] = useState(false);

  // Refactor: Efecto único para inicializar líneas y gestionar borrador local
  useEffect(() => {
    if (!pedido || (!pedido._id && !pedido.id)) {
      setLineas([]);
      setBorradorCorruptoEliminado(false);
      return;
    }
    // Sincronizar también si cambian las líneas del pedido (por ejemplo, tras suma de pesos)
    if (pedido.lineas && Array.isArray(pedido.lineas)) {
      setLineas(pedido.lineas.map(l => ({ ...l })));
      setBorradorCorruptoEliminado(false);
      return;
    }
    // Log para depuración
    console.log('[PedidoEditorFabrica] pedido.lineas:', pedido.lineas);
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    let borrador = null;
    let borradorCorrupto = false;
    try {
      const borradorStr = localStorage.getItem(borradorKey);
      if (borradorStr) borrador = JSON.parse(borradorStr);
    } catch {
      borradorCorrupto = true;
    }
    if (borrador && Array.isArray(borrador.lineas) && borrador.lineas.length > 0) {
      setLineas(borrador.lineas.map(l => ({ ...l })));
      setBorradorCorruptoEliminado(false);
    } else if (borrador && (!Array.isArray(borrador.lineas) || borrador.lineas.length === 0)) {
      // Borrador corrupto o vacío: eliminarlo y mostrar líneas del pedido real
      try { localStorage.removeItem(borradorKey); } catch {}
      if (pedido?.lineas?.length > 0) {
        setLineas(pedido.lineas.map(l => ({ ...l })));
      } else {
        setLineas([]);
      }
      setBorradorCorruptoEliminado(true);
    } else if (borradorCorrupto) {
      // Si el JSON estaba corrupto
      try { localStorage.removeItem(borradorKey); } catch {}
      if (pedido?.lineas?.length > 0) {
        setLineas(pedido.lineas.map(l => ({ ...l })));
      } else {
        setLineas([]);
      }
      setBorradorCorruptoEliminado(true);
    } else if (pedido?.lineas?.length > 0) {
      setLineas(pedido.lineas.map(l => ({ ...l })));
      setBorradorCorruptoEliminado(false);
    } else {
      setLineas([]);
      setBorradorCorruptoEliminado(false);
    }
  }, [pedido, pedido?.lineas]);

  // Guardar automáticamente en localStorage cada vez que cambian las líneas
  useEffect(() => {
    if (!pedido || (!pedido._id && !pedido.id)) return;
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    try {
      localStorage.setItem(borradorKey, JSON.stringify({ ...pedido, lineas }));
    } catch {}
    setGuardado(false);
  }, [lineas, pedido]);

  // Limpiar borrador local tras guardar definitivo
  const limpiarBorradorLocal = () => {
    if (!pedido || (!pedido._id && !pedido.id)) return;
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    try { localStorage.removeItem(borradorKey); } catch {}
  };

  // Marcar como no guardado si hay cambios
  useEffect(() => {
    setGuardado(false);
  }, [lineas]);

  // Handlers de usuario que notifican cambios al padre
  const notificarCambio = (nuevasLineas) => {
    if (typeof onChange === 'function' && pedido && (pedido._id || pedido.id)) {
      onChange({ ...pedido, lineas: nuevasLineas });
    }
  };

  const actualizarLinea = (idx, campo, valor) => {
    setLineas(prev => {
      const nuevas = prev.map((l, i) => {
        if (i !== idx) return l;
        if (l.esComentario && campo !== 'comentario') return l;
        let nuevoValor = valor;
        if (campo === 'peso' || campo === 'cantidadEnviada') {
          nuevoValor = valor === '' ? null : parseFloat(valor);
          if (isNaN(nuevoValor)) nuevoValor = null;
        }
        return { ...l, [campo]: nuevoValor };
      });
      notificarCambio(nuevas);
      return nuevas;
    });
  };
  const borrarLinea = idx => setLineas(prev => {
    const nuevas = prev.filter((_, i) => i !== idx);
    notificarCambio(nuevas);
    return nuevas;
  });
  const addLinea = () => setLineas(prev => {
    const nuevas = [...prev, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null, cantidadEnviada: null, lote: '', preparada: false, esComentario: false }];
    notificarCambio(nuevas);
    return nuevas;
  });
  const addComentario = () => setLineas(prev => {
    const nuevas = [...prev, { esComentario: true, comentario: '' }];
    notificarCambio(nuevas);
    return nuevas;
  });

  const getLineasNormalizadas = () => lineas.filter(l => l.esComentario || (l.producto && l.cantidad !== undefined && l.cantidad !== null)).map(l => l.esComentario ? { esComentario: true, comentario: l.comentario || '' } : { ...l, preparada: !!l.preparada, peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso), cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada), cantidad: Number(l.cantidad) });

  // Guardar solo guarda y muestra feedback
  const handleGuardar = async () => {
    setError('');
    setLoading(true);
    try {
      if (!pedido || (!pedido._id && !pedido.id) || !onLineaDetalleChange) {
        setLoading(false);
        return;
      }
      const lineasNormalizadas = getLineasNormalizadas();
      await onLineaDetalleChange(pedido._id || pedido.id, null, lineasNormalizadas);
      setGuardado(true);
      if (!onRecargarPedidos) {
        setMensajeGuardado('¡Guardado correctamente!');
        setTimeout(() => setMensajeGuardado(''), 2000);
      } else {
        setMensajeGuardado('');
      }
      limpiarBorradorLocal();
      // Solo notifica al padre si se pasa onRecargarPedidos (solo en fábrica)
      if (typeof onRecargarPedidos === 'function') {
        await onRecargarPedidos();
      }
    } catch (e) {
      setError('Error al guardar el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Nuevo handler robusto para pedidos existentes (edición)
  const handleGuardarYEnviar = async () => {
    setError('');
    setLoading(true);
    try {
      if (!pedido || (!pedido._id && !pedido.id) || !onLineaDetalleChange || !onEstadoChange) {
        if (onSend) await onSend(getLineasNormalizadas());
        setLoading(false);
        return;
      }
      const lineasNormalizadas = getLineasNormalizadas();
      await onLineaDetalleChange(pedido._id || pedido.id, null, lineasNormalizadas);
      await onEstadoChange(pedido._id || pedido.id, 'enviadoTienda');
      limpiarBorradorLocal();
      if (onSend) await onSend(lineasNormalizadas);
      // Solo notifica al padre si se pasa onRecargarPedidos (solo en fábrica)
      if (typeof onRecargarPedidos === 'function') {
        await onRecargarPedidos();
      }
    } catch (e) {
      setError('Error al guardar y enviar el pedido. Intenta de nuevo.');
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        overflowX: 'auto',
        overflowY: 'auto',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0001',
        background: '#fff',
        position: 'relative',
        padding: '0',
        maxWidth: '100vw',
        minWidth: 0,
        height: '100%',
        minHeight: 0
      }}
    >
      <style>{`
        @media screen and (max-width: 1024px) {
          .tabla-edicion-fabrica {
            display: block;
            width: 100%;
            overflow-x: auto;
            overflow-y: auto;
            max-width: 100vw;
            min-width: 0;
          }
          .tabla-edicion-fabrica thead, .tabla-edicion-fabrica tbody, .tabla-edicion-fabrica tr {
            display: table;
            width: 100%;
            table-layout: fixed;
          }
          .tabla-edicion-fabrica td, .tabla-edicion-fabrica th {
            word-break: break-word;
            white-space: pre-line;
            min-width: 80px;
            font-size: 16px;
            padding: 10px 6px;
          }
          .celda-producto {
            min-width: 220px;
            max-width: 100%;
            white-space: pre-line;
            word-break: break-word;
            padding: 0;
          }
          .input-producto {
            width: 100%;
            min-width: 180px;
            max-width: 100%;
            min-height: 44px;
            height: auto;
            font-size: 16px;
            padding: 10px 8px;
            border-radius: 6px;
            border: 1px solid #bbb;
            box-sizing: border-box;
            resize: vertical;
            overflow-wrap: break-word;
            white-space: pre-line;
            display: block;
          }
        }
      `}</style>
      {borradorCorruptoEliminado && (
        <div style={{position:'absolute',top:10,right:18,zIndex:10,background:'#fff3cd',color:'#856404',border:'1px solid #ffeeba',borderRadius:8,padding:'10px 18px',fontWeight:600,fontSize:15,boxShadow:'0 2px 8px #0001'}}>
          Se detectó y eliminó un borrador local corrupto o vacío. Se restauraron las líneas originales del pedido.
        </div>
      )}
      {/* Mensaje si no hay líneas en el pedido */}
      {(!lineas || lineas.length === 0) && (
        <div style={{margin:'80px auto',color:'#b94a48',background:'#f2dede',border:'1px solid #ebccd1',borderRadius:8,padding:'18px 24px',fontWeight:600,fontSize:17,maxWidth:600,textAlign:'center'}}>
          Este pedido no contiene ninguna línea.<br />
          {pedido && pedido.lineas && pedido.lineas.length === 0 && 'El pedido recibido no tiene líneas.'}
          {pedido && (!pedido.lineas || pedido.lineas === undefined) && 'No se han recibido datos de líneas para este pedido.'}
        </div>
      )}
      {/* Botones de acción arriba a la izquierda y añadir línea/comentario arriba a la derecha */}
      <div style={{position:'absolute',top:18,left:18,zIndex:2,display:'flex',gap:12}}>
        <button style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer'}} onClick={handleGuardar} disabled={loading}>Guardar</button>
        {onSend && pedido && (pedido._id || pedido.id) && onLineaDetalleChange && onEstadoChange && (
          <button style={{background: guardado ? '#007bff' : '#bbb', color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor: guardado ? 'pointer' : 'not-allowed'}} onClick={handleGuardarYEnviar} disabled={loading || !guardado}>Guardar y enviar</button>
        )}
        {onSend && (!pedido || (!pedido._id && !pedido.id)) && (
          <button style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}} onClick={()=>onSend(getLineasNormalizadas())} disabled={loading}>Guardar y enviar</button>
        )}
        {onCancel && <button style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginLeft:12}} onClick={onCancel} disabled={loading}>Cerrar</button>}
      </div>
      <div style={{position:'absolute',top:18,right:18,zIndex:2,display:'flex',gap:12}}>
        <button style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:0}} onClick={addLinea}>Añadir línea de producto</button>
        <button style={{background:'#6c757d',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:0}} onClick={addComentario}>Añadir comentario</button>
      </div>
      <table
        className="tabla-edicion-fabrica"
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
          fontFamily: 'inherit',
          borderRadius: 12,
          overflow: 'hidden',
          marginTop: 70,
          minWidth: 600,
          tableLayout: 'fixed',
          wordBreak: 'break-word',
          background: '#fff'
        }}
      >
        <thead>
          <tr>
            <th className="celda-producto" style={{ minWidth: 120, maxWidth: 300, fontSize: 14, padding: 6, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>Producto</th>
            <th style={{ minWidth: 70, maxWidth: 90, fontSize: 14, padding: 6 }}>Cant. pedida</th>
            <th style={{ minWidth: 70, maxWidth: 90, fontSize: 14, padding: 6 }}>Peso (kg)</th>
            <th style={{ minWidth: 70, maxWidth: 90, fontSize: 14, padding: 6 }}>Cant. enviada</th>
            <th style={{ minWidth: 70, maxWidth: 90, fontSize: 14, padding: 6 }}>Lote</th>
            <th style={{ minWidth: 90, maxWidth: 120, fontSize: 14, padding: 6 }}>Formato pedido</th>
            <th style={{ minWidth: 120, maxWidth: 180, fontSize: 14, padding: 6 }}>Comentario</th>
            <th style={{ minWidth: 60, maxWidth: 80, fontSize: 14, padding: 6 }}>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, idx) => linea.esComentario ? (
            <tr key={`comment-${idx}`} style={{ backgroundColor: '#fffbe6', border: '2px solid #ffe58f' }}>
              <td colSpan="8" style={{ padding: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 'bold', color: '#b8860b', fontSize: 16 }}>📝 COMENTARIO:</span>
                  <input
                    type="text"
                    value={linea.comentario || ''}
                    onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                    placeholder="Escribe aquí tu comentario..."
                    style={{ width: '100%', border: '1px dashed #b8860b', borderRadius: 6, padding: '8px 12px', background: '#fffdf7', fontStyle: 'italic', fontSize: 15, color: '#b8860b', minWidth: 0, boxSizing: 'border-box' }}
                  />
                  <button style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',fontSize: 14, alignSelf: 'flex-end'}} onClick={() => borrarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
                </div>
              </td>
            </tr>
          ) : (
            <tr key={idx}>
              <td>
                <input
                  list="productos-lista-global"
                  value={linea.producto}
                  onChange={e => actualizarLinea(idx, 'producto', e.target.value)}
                  placeholder="Producto"
                  style={{ width: '100%', minWidth: 0, border: '1px solid #bbb', borderRadius: 6, padding: '6px 8px', fontSize: 15, boxSizing: 'border-box' }}
                />
                <datalist id="productos-lista-global">
                  {productos.map(prod => (
                    <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                      {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                    </option>
                  ))}
                </datalist>
              </td>
              <td style={{position:'relative',display:'flex',alignItems:'center',gap:6}}>
                <input
                  type="number"
                  min="1"
                  value={linea.cantidad}
                  onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                  onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                  style={{ width: '100%', minWidth: 0, zIndex: 1, position: 'relative', background: '#fff', boxSizing: 'border-box' }}
                />
                {typeof onAbrirModalPeso === 'function' && !linea.esComentario &&
                  Number(linea.cantidad) >= 2 && Number(linea.cantidad) < 10 && (
                    <button
                      type="button"
                      style={{
                        background: '#eafaf1',
                        border: '1px solid #28a745',
                        borderRadius: '50%',
                        padding: '2px 7px',
                        cursor: 'pointer',
                        marginLeft: 4,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: 28,
                        width: 28
                      }}
                      title="Sumar pesos"
                      onClick={() => onAbrirModalPeso(idx, linea.peso, linea.cantidad)}
                    >
                      ➕
                    </button>
                  )}
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
                  onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
                  onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <select value={linea.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)} style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}>
                  {FORMATOS_PEDIDO.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  value={linea.comentario === null || linea.comentario === undefined ? '' : linea.comentario}
                  onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                  style={{ width: '100%', minWidth: 0, boxSizing: 'border-box' }}
                />
              </td>
              <td>
                <button style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}} onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑</button>
              </td>
            </tr>
          ))}
          {/* Eliminar los botones de acción de la parte inferior */}
          {/* {mensajeGuardado && <tr><td colSpan="8" style={{color:'green',textAlign:'center',fontWeight:600}}>{mensajeGuardado}</td></tr>} */}
          {/* {error && <tr><td colSpan="8" style={{color:'red',textAlign:'center',fontWeight:600}}>{error}</td></tr>} */}
        </tbody>
      </table>
      {/* Mensaje de guardado local solo si está en panel de fábrica */}
      {mensajeGuardado && onRecargarPedidos && (
        <div style={{position:'absolute',top:70,left:18,color:'green',fontWeight:600,fontSize:16}}>{mensajeGuardado}</div>
      )}
      {error && <div style={{position:'absolute',top:100,left:18,color:'red',fontWeight:600,fontSize:16}}>{error}</div>}
    </div>
  );
}
