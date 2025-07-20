import React, { useState, useEffect } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';
import { useLotesDisponibles } from '../hooks/useLotesDisponibles';
import './PedidoEditorFabrica.css'; // Importar el archivo CSS
import '../styles/datalist-fix.css'; // Importar arreglos para datalist

function LoteSelector({ productoId, value, onChange }) {
  const { lotes, loading, error } = useLotesDisponibles(productoId);

  return (
    <>
      <input
        type="text"
        value={value}
        onChange={onChange}
        list={`lotes-disponibles-${productoId}`}
        placeholder="Seleccionar lote"
      />
      <datalist id={`lotes-disponibles-${productoId}`}>
        {loading && <option value="Cargando lotes..." />}
        {error && <option value={`Error: ${error}`} />}
        {lotes.map(lote => (
          <option key={lote._id} value={lote.lote}>
            {`${lote.lote} (Disp: ${lote.cantidadDisponible} / ${lote.pesoDisponible}kg)`}
          </option>
        ))}
      </datalist>
    </>
  );
}

export default function PedidoEditorFabrica({ pedido, onSave, onSend, onCancel, tiendas, tiendaNombre, onLineaDetalleChange, onEstadoChange, onAbrirModalPeso, onChange, onRecargarPedidos }) {
  const { productos } = useProductos();
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [mensajeGuardadoExitoso, setMensajeGuardadoExitoso] = useState('');

  // Estado para detectar y mostrar si se eliminó un borrador corrupto
  const [borradorCorruptoEliminado, setBorradorCorruptoEliminado] = useState(false);

  // Refactor: Efecto único para inicializar líneas y gestionar borrador local
  useEffect(() => {
    if (!pedido || (!pedido._id && !pedido.id)) {
      setLineas([]);
      setBorradorCorruptoEliminado(false);
      return;
    }
    if (pedido.lineas && Array.isArray(pedido.lineas)) {
      setLineas(pedido.lineas.map(l => ({ ...l })));
      setBorradorCorruptoEliminado(false);
      return;
    }
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
      try { localStorage.removeItem(borradorKey); } catch {}
      if (pedido?.lineas?.length > 0) {
        setLineas(pedido.lineas.map(l => ({ ...l })));
      } else {
        setLineas([]);
      }
      setBorradorCorruptoEliminado(true);
    } else if (borradorCorrupto) {
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

  useEffect(() => {
    if (!pedido || (!pedido._id && !pedido.id)) return;
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    try {
      localStorage.setItem(borradorKey, JSON.stringify({ ...pedido, lineas }));
    } catch {}
    setGuardado(false);
  }, [lineas, pedido]);

  const limpiarBorradorLocal = () => {
    if (!pedido || (!pedido._id && !pedido.id)) return;
    const borradorKey = `pedido_borrador_${pedido._id || pedido.id}`;
    try { localStorage.removeItem(borradorKey); } catch {}
  };

  useEffect(() => {
    setGuardado(false);
  }, [lineas]);

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

  const handleGuardar = async () => {
    setError('');
    setMensajeGuardadoExitoso('');
    setLoading(true);
    try {
      if (!pedido || (!pedido._id && !pedido.id) || !onLineaDetalleChange) {
        setLoading(false);
        return;
      }
      const lineasNormalizadas = getLineasNormalizadas();
      await onLineaDetalleChange(pedido._id || pedido.id, null, lineasNormalizadas);
      setGuardado(true);
      setMensajeGuardadoExitoso('¡Guardado correctamente!');
      setTimeout(() => setMensajeGuardadoExitoso(''), 3000);
      limpiarBorradorLocal();
      if (typeof onRecargarPedidos === 'function') {
        await onRecargarPedidos();
      }
    } catch (e) {
      setError('Error al guardar el pedido. Intenta de nuevo.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarYEnviar = async () => {
    setError('');
    setMensajeGuardadoExitoso('');
    setLoading(true);
    try {
      if (!pedido || (!pedido._id && !pedido.id) || !onLineaDetalleChange || !onEstadoChange) {
        if (onSend) await onSend(getLineasNormalizadas()); // Para creación de nuevo pedido
        setLoading(false);
        return;
      }
      // Primero guardar cambios
      const lineasNormalizadas = getLineasNormalizadas();
      await onLineaDetalleChange(pedido._id || pedido.id, null, lineasNormalizadas);
      // Luego cambiar estado
      await onEstadoChange(pedido._id || pedido.id, 'enviadoTienda');
      limpiarBorradorLocal();
      setMensajeGuardadoExitoso('¡Guardado y enviado correctamente!');
      setTimeout(() => setMensajeGuardadoExitoso(''), 3000);
      if (onSend) await onSend(lineasNormalizadas); // Notificar al padre
      if (typeof onRecargarPedidos === 'function') {
        await onRecargarPedidos();
      }
    } catch (e) {
      setError('Error al guardar y enviar el pedido. Intenta de nuevo.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pedido-editor-fabrica-container pedido-editor-modal-container">
      {/* Cabecera con título y botones de acción principales */}
      <div className="editor-header">
        <h3>{tiendaNombre ? `${tiendaNombre} - ` : ''}Pedido #{pedido?.numeroPedido || 'Nuevo'}</h3>
        <div className="editor-actions-main">
          <button className="btn-success" onClick={handleGuardar} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          {onSend && ( // Mostrar solo si onSend está disponible (para creación o envío)
            <button
              className="btn-premium"
              onClick={handleGuardarYEnviar}
              disabled={loading || (!guardado && pedido && (pedido._id || pedido.id))} // Deshabilitado si no se ha guardado primero (en edición)
            >
              {loading ? 'Enviando...' : (pedido && (pedido._id || pedido.id) ? 'Guardar y Enviar a Tienda' : 'Crear y Enviar Pedido')}
            </button>
          )}
          {onCancel && (
            <button className="btn-default" onClick={onCancel} disabled={loading}>
              Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de feedback */}
      {borradorCorruptoEliminado && (
        <div className="borrador-corrupto-mensaje feedback-info">
          Se detectó y eliminó un borrador local corrupto o vacío. Se restauraron las líneas originales del pedido.
        </div>
      )}
      {mensajeGuardadoExitoso && <div className="editor-feedback feedback-success">{mensajeGuardadoExitoso}</div>}
      {error && <div className="editor-feedback feedback-error">{error}</div>}

      {/* Cuerpo del editor con las líneas de pedido */}
      <div className="editor-body">
        {(!lineas || lineas.length === 0) && (
          <div className="no-lineas-mensaje">
            Este pedido no contiene ninguna línea.<br />
            {pedido && pedido.lineas && pedido.lineas.length === 0 && 'El pedido recibido no tiene líneas.'}
            {pedido && (!pedido.lineas || pedido.lineas === undefined) && 'No se han recibido datos de líneas para este pedido.'}
            <p>Puedes añadir líneas usando los botones de abajo.</p>
          </div>
        )}

        {lineas.map((linea, idx) => (
          linea.esComentario ? (
            <div key={`comment-${idx}`} className="linea-comentario-card">
              <h4>📝 COMENTARIO</h4>
              <div className="form-group">
                <textarea
                  value={linea.comentario || ''}
                  onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                  placeholder="Escribe aquí tu comentario..."
                />
              </div>
              <div className="linea-actions">
                <button className="btn-danger" onClick={() => borrarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
              </div>
            </div>
          ) : (
            <div key={idx} className="linea-pedido-card">
              <div className="form-group">
                <label htmlFor={`producto-${idx}`}>Producto</label>
                <input
                  id={`producto-${idx}`}
                  list="productos-lista-global"
                  value={linea.producto}
                  onChange={e => actualizarLinea(idx, 'producto', e.target.value)}
                  onKeyDown={e => {
                    // Si se presiona Enter, buscar producto por referencia exacta
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const valor = e.target.value.trim();
                      // Buscar producto por referencia exacta
                      const productoEncontrado = productos.find(p => p.referencia && 
                        String(p.referencia).toLowerCase() === String(valor).toLowerCase());
                      if (productoEncontrado) {
                        actualizarLinea(idx, 'producto', productoEncontrado.nombre);
                      }
                    }
                  }}
                  onBlur={e => {
                    // Al perder foco, verificar si es una referencia exacta
                    const valor = e.target.value.trim();
                    const productoEncontrado = productos.find(p => p.referencia && 
                      String(p.referencia).toLowerCase() === String(valor).toLowerCase());
                    if (productoEncontrado) {
                      actualizarLinea(idx, 'producto', productoEncontrado.nombre);
                    }
                  }}
                  placeholder="Nombre del producto o referencia"
                  className="producto-nombre-input"
                />
                <datalist id="productos-lista-global">
                  {productos.map(prod => (
                    <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                      {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor={`cantidad-${idx}`}>Cant. pedida</label>
                  <input
                    id={`cantidad-${idx}`}
                    type="number"
                    min="0"
                    step="any" // Permitir decimales si es necesario
                    value={linea.cantidad === null || linea.cantidad === undefined ? '' : linea.cantidad}
                    onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`peso-${idx}`}>Peso (kg)</label>
                  <div className="peso-input-container">
                    <input
                      id={`peso-${idx}`}
                      type="number"
                      min="0"
                      step="any"
                      value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                      onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                    />
                    {typeof onAbrirModalPeso === 'function' && !linea.esComentario &&
                      Number(linea.cantidad) >= 2 && Number(linea.cantidad) < 100 && ( // Aumentado el límite para sumar pesos
                        <button
                          type="button"
                          className="btn-add-peso"
                          title="Sumar pesos individuales"
                          onClick={() => onAbrirModalPeso(idx, linea.peso, linea.cantidad)}
                        >
                          Σ
                        </button>
                      )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor={`cantidadEnviada-${idx}`}>Cant. enviada</label>
                  <input
                    id={`cantidadEnviada-${idx}`}
                    type="number"
                    min="0"
                    step="any"
                    value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
                    onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`lote-${idx}`}>Lote</label>
                  <LoteSelector
                    productoId={productos.find(p => p.nombre === linea.producto)?._id}
                    value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
                    onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor={`formato-${idx}`}>Formato pedido</label>
                  <select
                    id={`formato-${idx}`}
                    value={linea.formato || ''}
                    onChange={e => actualizarLinea(idx, 'formato', e.target.value)}
                  >
                    {FORMATOS_PEDIDO.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}> {/* Ocupa dos columnas si es posible */}
                  <label htmlFor={`comentarioLinea-${idx}`}>Comentario de línea</label>
                  <input
                    id={`comentarioLinea-${idx}`}
                    type="text"
                    value={linea.comentario === null || linea.comentario === undefined ? '' : linea.comentario}
                    onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
                    placeholder="Comentario específico para esta línea"
                  />
                </div>
              </div>

              <div className="linea-actions">
                <button className="btn-danger" onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑 Eliminar Línea</button>
              </div>
            </div>
          )
        ))}
      </div>

      {/* Pie de página con botones para añadir líneas */}
      <div className="editor-footer-actions">
        <button className="btn-secondary" onClick={addLinea} disabled={loading}>
          + Añadir Producto
        </button>
        <button className="btn-info" onClick={addComentario} disabled={loading}>
          + Añadir Comentario
        </button>
      </div>

      {/* La tabla original se elimina completamente y se reemplaza por el diseño de tarjetas */}
      {/* <table className="tabla-edicion-fabrica"> ... </table> */}
    </div>
  );
}
