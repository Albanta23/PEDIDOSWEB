import React, { useState, useEffect } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';
import { useLotesDisponibles } from '../hooks/useLotesDisponibles';
import './PedidoEditorFabrica.css'; // Importar el archivo CSS
import '../styles/datalist-fix.css'; // Importar arreglos para datalist
import '../styles/lote-selector.css'; // Importar estilos para el selector de lotes

function LoteSelector({ productoId, value, onChange, lotes, loading, error }) {
  const [isManual, setIsManual] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');

  // Actualizar el valor cuando cambia el prop value
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Manejar cambios en el input
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange(e);
  };

  // Alternar entre selección de lista y entrada manual
  const toggleManualMode = () => {
    setIsManual(!isManual);
  };

  return (
    <div className="lote-selector-container">
      <div className="lote-input-container">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          list={isManual ? undefined : `lotes-disponibles-${productoId}`}
          placeholder={isManual ? "Ingrese lote manualmente" : "Seleccionar lote"}
          style={{ width: "calc(100% - 30px)" }}
        />
        <button 
          type="button" 
          onClick={toggleManualMode} 
          title={isManual ? "Cambiar a selección de lotes disponibles" : "Cambiar a entrada manual de lote"}
          style={{
            width: "26px",
            height: "26px",
            padding: "2px",
            marginLeft: "4px",
            background: isManual ? "#e1f5fe" : "#f5f5f5",
            border: "1px solid #ccc",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          {isManual ? "📋" : "✏️"}
        </button>
      </div>
      
      {!isManual && (
        <datalist id={`lotes-disponibles-${productoId}`}>
          {loading && <option value="Cargando lotes..." />}
          {error && <option value={`Error: ${error}`} />}
          {!loading && !error && lotes.length === 0 && (
            <option value="No hay lotes disponibles">No hay lotes disponibles</option>
          )}
          {lotes.map(lote => (
            <option key={lote._id} value={lote.lote}>
              {`${lote.lote} (Disp: ${lote.cantidadDisponible} / ${lote.pesoDisponible}kg)`}
            </option>
          ))}
        </datalist>
      )}
      
      {!isManual && !loading && !error && lotes.length === 0 && (
        <div style={{ color: '#f57c00', fontSize: '12px', marginTop: '4px' }}>
          ⚠️ No hay lotes disponibles para este producto
        </div>
      )}
      
      {isManual && (
        <div style={{ color: '#2196f3', fontSize: '12px', marginTop: '4px' }}>
          ℹ️ Modo manual: Ingrese cualquier número de lote
        </div>
      )}
    </div>
  );
}

function LineaPedido({ linea, idx, productos, actualizarLinea, borrarLinea, onAbrirModalPeso }) {
  const producto = productos.find(p => p.nombre === linea.producto);
  const { lotes, loading, error } = useLotesDisponibles(producto?._id);

  return (
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
              
              step="any"
              value={linea.cantidadEnviada === null || linea.cantidadEnviada === undefined ? '' : linea.cantidadEnviada}
              onChange={e => actualizarLinea(idx, 'cantidadEnviada', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor={`lote-${idx}`}>Lote</label>
            <LoteSelector
              productoId={producto?._id}
              value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
              onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
              lotes={lotes}
              loading={loading}
              error={error}
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

  // Versión normalizadora mejorada para compatibilidad con el backend
  // Normaliza las líneas para enviar solo los campos permitidos y sin valores vacíos
  // Asegura que los tipos de datos sean compatibles con lo que espera el modelo de Mongoose
  const CAMPOS_LINEA_PERMITIDOS = [
    'producto', 'cantidad', 'formato', 'comentario', 'peso', 'cantidadEnviada', 'lote', 'preparada', 'esComentario'
  ];
  const getLineasNormalizadas = () => {
    // Primero filtramos líneas inválidas o vacías
    const lineasFiltradas = lineas.map(l => {
      if (l.esComentario) {
        return { esComentario: true, comentario: l.comentario || '' };
      }

      // Validación básica: producto obligatorio
      const tieneProducto = typeof l.producto === 'string' && l.producto.trim() !== '';
      if (!tieneProducto) return null;

      // Para líneas normales, lote puede ser opcional si no está en estado preparado
      const tieneLote = typeof l.lote === 'string' && l.lote.trim() !== '';
      const cantidadValida = l.cantidad !== undefined && l.cantidad !== null && l.cantidad !== '' && !isNaN(Number(l.cantidad));
      const pesoValido = l.peso !== undefined && l.peso !== null && l.peso !== '' && !isNaN(Number(l.peso));
      
      // Si no tiene cantidad ni peso, o si está preparada pero no tiene lote, es inválida
      if ((!cantidadValida && !pesoValido) || (l.preparada && !tieneLote)) {
        return null;
      }
      
      // Crear objeto normalizado con tipos correctos
      const nueva = {};
      for (const campo of CAMPOS_LINEA_PERMITIDOS) {
        let valor = l[campo];
        
        // Normalizar campos numéricos
        if (["cantidad", "peso", "cantidadEnviada"].includes(campo)) {
          if (valor === undefined || valor === null || valor === '' || isNaN(Number(valor))) continue;
          valor = Number(valor);
          // No permitir ceros negativos o valores muy pequeños que pueden ser errores de redondeo
          if (Math.abs(valor) < 0.001) continue;
        }
        
        // Normalizar booleanos
        if (campo === "preparada" || campo === "esComentario") {
          valor = !!valor; // Convertir a booleano explícito
        }
        
        // No incluir strings vacíos
        if (typeof valor === 'string' && valor.trim() === '') continue;
        
        // No incluir undefined/null
        if (valor === undefined || valor === null) continue;
        
        nueva[campo] = valor;
      }
      
      // Asegurar que los campos obligatorios estén presentes
      if (!nueva.esComentario && !nueva.producto) return null;
      
      return nueva;
    }).filter(l => l !== null);
    
    console.log('Líneas normalizadas para enviar:', lineasFiltradas);
    return lineasFiltradas;
  };

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
      
      // Log detallado para diagnosticar el problema
      console.log('=============== GUARDANDO PEDIDO ===============');
      console.log('ID del pedido:', pedido._id || pedido.id);
      console.log('Número de líneas normalizadas:', lineasNormalizadas.length);
      console.log('Líneas que se enviarán al backend:', JSON.stringify(lineasNormalizadas, null, 2));
      
      await onLineaDetalleChange(pedido._id || pedido.id, null, lineasNormalizadas);
      
      console.log('✅ Pedido actualizado correctamente');
      setGuardado(true);
      setMensajeGuardadoExitoso('¡Guardado correctamente!');
      setTimeout(() => setMensajeGuardadoExitoso(''), 3000);
      limpiarBorradorLocal();
      if (typeof onRecargarPedidos === 'function') {
        await onRecargarPedidos();
      }
    } catch (e) {
      console.error('❌ Error al guardar el pedido:', e);
      if (e.response) {
        console.error('Respuesta del servidor:', e.response.status, e.response.data);
      }
      setError(`Error al guardar el pedido: ${e.message || 'Verifique los datos e intente de nuevo.'}`);
      setTimeout(() => setError(''), 5000); // Mostrar error por más tiempo
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
          <LineaPedido
            key={idx}
            linea={linea}
            idx={idx}
            productos={productos}
            actualizarLinea={actualizarLinea}
            borrarLinea={borrarLinea}
            onAbrirModalPeso={onAbrirModalPeso}
          />
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
