import React, { useState, useEffect } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';

/**
 * Editor de pedido reutilizable para creación y edición en el panel de fábrica.
 * - Si recibe un pedido con id/_id, actúa como edición.
 * - Si no, actúa como creación.
 * - onSave(lineasNormalizadas) y onSend(lineasNormalizadas) son callbacks para guardar y guardar+enviar.
 */
export default function PedidoEditorFabrica({ pedido, onSave, onSend, onCancel, tiendas, tiendaNombre }) {
  const { productos } = useProductos();
  const [lineas, setLineas] = useState([]);
  useEffect(() => {
    setLineas(pedido?.lineas?.length ? pedido.lineas.map(l => ({ ...l })) : []);
  }, [pedido]);

  // Actualizar línea
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
  // Borrar línea
  const borrarLinea = idx => setLineas(prev => prev.filter((_, i) => i !== idx));
  // Añadir línea producto
  const addLinea = () => setLineas(prev => ([...prev, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null, cantidadEnviada: null, lote: '', preparada: false, esComentario: false }]));
  // Añadir comentario
  const addComentario = () => setLineas(prev => ([...prev, { esComentario: true, comentario: '' }]));

  // Normalizar y filtrar líneas
  const getLineasNormalizadas = () => lineas.filter(l => l.esComentario || (l.producto && l.cantidad !== undefined && l.cantidad !== null)).map(l => l.esComentario ? { esComentario: true, comentario: l.comentario || '' } : { ...l, preparada: !!l.preparada, peso: (l.peso === undefined || l.peso === null || l.peso === '' || isNaN(parseFloat(l.peso))) ? null : parseFloat(l.peso), cantidadEnviada: (l.cantidadEnviada === undefined || l.cantidadEnviada === null || l.cantidadEnviada === '' || isNaN(parseFloat(l.cantidadEnviada))) ? null : parseFloat(l.cantidadEnviada), cantidad: Number(l.cantidad) });

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
              {onSave && <button style={{background:'#28a745',color:'#fff',border:'none',borderRadius:6,padding:'10px 24px',fontWeight:700,fontSize:16,cursor:'pointer',marginRight:12}} onClick={()=>onSave(getLineasNormalizadas())}>Guardar</button>}
              {onSend && <button style={{background:'#007bff',color:'#fff',border:'none',borderRadius:6,padding:'10px 32px',fontWeight:700,fontSize:18,cursor:'pointer'}} onClick={()=>onSend(getLineasNormalizadas())}>Guardar y enviar</button>}
              {onCancel && <button style={{background:'#888',color:'#fff',border:'none',borderRadius:6,padding:'8px 18px',fontWeight:700,marginLeft:12}} onClick={onCancel}>Cancelar</button>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
