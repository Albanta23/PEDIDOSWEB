import React, { useState, useEffect } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';

export default function PedidoEditorFabrica({ pedido, onSave, onSend, onCancel, tiendas, tiendaNombre, onLineaDetalleChange, onEstadoChange }) {
  const { productos } = useProductos();
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState('');

  useEffect(() => {
    setLineas(pedido?.lineas?.length ? pedido.lineas.map(l => ({ ...l })) : []);
  }, [pedido]);

  // Marcar como no guardado si hay cambios
  useEffect(() => {
    setGuardado(false);
  }, [lineas]);

  const actualizarLinea = (idx, campo, valor) => {
    setLineas(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      if (l.esComentario && campo !== 'comentario') return l;
      let nuevoValor = valor;
      if (campo === 'peso' || campo === 'cantidadEnviada') {
        nuevoValor = valor === '' ? null : parseFloat(valor);
        if (isNaN(nuevoValor)) nuevoValor = null;
      }
      return { ...l, [campo]: nuevoValor };
    }));
  };
  const borrarLinea = idx => setLineas(prev => prev.filter((_, i) => i !== idx));
  const addLinea = () => setLineas(prev => ([...prev, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null, cantidadEnviada: null, lote: '', preparada: false, esComentario: false }]));
  const addComentario = () => setLineas(prev => ([...prev, { esComentario: true, comentario: '' }]));

  const getLineasNormalizadas = () => lineas.filter(l => l.esComentario || (l.producto && l.cantidad !== undefined && l.cantidad !== null)).map(l => l.esComentario ? { esComentario: true, comentario: l.comentario || '' } : { ...l, preparada: !!l.preparada, peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso), cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada), cantidad: Number(l.cantidad) });

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
      if (onSend) await onSend(lineasNormalizadas);
    } catch (e) {
      setError('Error al guardar y enviar el pedido. Intenta de nuevo.');
      return;
    } finally {
      setLoading(false);
    }
  };

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
      setMensajeGuardado('¡Guardado correctamente!');
      setTimeout(() => setMensajeGuardado(''), 2000);
    } catch (e) {
      setError('Error al guardar el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{overflowX:'auto', borderRadius:12, boxShadow:'0 2px 12px #0001', background:'#fff'}}>
      <table className="tabla-edicion-fabrica" style={{width:'100%', borderCollapse:'separate', borderSpacing:0, fontFamily:'inherit', borderRadius:12, overflow:'hidden'}}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cant. pedida</th>
            <th>Peso (kg)</th>
            <th>Cant. enviada</th>
            <th>Lote</th>
            <th>Formato pedido</th>
            <th>Comentario</th>
            <th>Eliminar</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea, idx) => linea.esComentario ? (
            <tr key={`comment-${idx}`} style={{ backgroundColor: '#fffbe6', border: '2px solid #ffe58f' }}>
              <td colSpan="8" style={{ padding: '12px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20, color: '#b8860b' }}>📝</span>
                  <span style={{ fontWeight: 'bold', color: '#b8860b', fontSize: 16 }}>COMENTARIO:</span>
                  <input
                    type="text"
                    value={linea.comentario || ''}
                    onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                    placeholder="Escribe aquí tu comentario..."
                    style={{ flexGrow: 1, border: '1px dashed #b8860b', borderRadius: 6, padding: '8px 12px', background: '#fffdf7', fontStyle: 'italic', fontSize: 15, color: '#b8860b' }}
                  />
                  <button style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 12px',fontWeight:600,cursor:'pointer',fontSize: 14}} onClick={() => borrarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
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
                  style={{ width: 260, border: '1px solid #bbb', borderRadius: 6, padding: '6px 8px', fontSize: 15 }}
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
                  style={{ width: 60 }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                  onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                  style={{ width: 70, zIndex: 1, position: 'relative', background: '#fff' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
                  onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                  style={{ width: 70 }}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
                  onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                  style={{ width: 90 }}
                />
              </td>
              <td>
                <select value={linea.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)} style={{ width: 90 }}>
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
                  style={{ width: 110 }}
                />
              </td>
              <td>
                <button style={{background:'#dc3545',color:'#fff',border:'none',borderRadius:4,padding:'4px 10px',fontWeight:600,cursor:'pointer'}} onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑</button>
              </td>
            </tr>
          ))}
          {/* Botón para añadir línea */}
          <tr>
            <td colSpan="8" style={{textAlign:'left', paddingTop:8}}>
              <button style={{background:'#00c6ff',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8, marginRight: 12}} onClick={addLinea}>Añadir línea de producto</button>
              <button style={{background:'#6c757d',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginBottom:8}} onClick={addComentario}>Añadir comentario</button>
            </td>
          </tr>
          <tr>
            <td colSpan="8" style={{textAlign:'right', paddingTop:16}}>
              <button style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}} onClick={handleGuardar} disabled={loading}>Guardar</button>
              {onSend && pedido && (pedido._id || pedido.id) && onLineaDetalleChange && onEstadoChange && (
                <button style={{background: guardado ? '#007bff' : '#bbb', color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor: guardado ? 'pointer' : 'not-allowed'}} onClick={handleGuardarYEnviar} disabled={loading || !guardado}>Guardar y enviar</button>
              )}
              {onSend && (!pedido || (!pedido._id && !pedido.id)) && (
                <button style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}} onClick={()=>onSend(getLineasNormalizadas())} disabled={loading}>Guardar y enviar</button>
              )}
              {onCancel && <button style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginLeft:12}} onClick={onCancel} disabled={loading}>Cerrar</button>}
            </td>
          </tr>
          {mensajeGuardado && <tr><td colSpan="8" style={{color:'green',textAlign:'center',fontWeight:600}}>{mensajeGuardado}</td></tr>}
          {error && <tr><td colSpan="8" style={{color:'red',textAlign:'center',fontWeight:600}}>{error}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
