import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from './ProductosContext';
import { useLotesDisponibles } from '../hooks/useLotesDisponibles';
import './PedidoEditorFabrica.css'; // Importar el archivo CSS
import '../styles/datalist-fix.css'; // Importar arreglos para datalist
import '../styles/lote-selector.css'; // Importar estilos para el selector de lotes
import '../styles/PedidoEditorFabrica-EAN.css'; // 🆕 Estilos para sistema EAN

// 🆕 CONFIGURACIÓN DE CÓDIGOS EAN
const EAN_CONFIG = {
  // Tipo 1: EAN-13 estándar (prefijo + lote + peso)
  TIPO_1: {
    pattern: /^(\d{3})(\w{4,8})(\d{4})$/,
    descripcion: 'Prefijo(3) + Lote(4-8) + Peso(4)',
    extraer: (codigo) => {
      const match = codigo.match(/^(\d{3})(\w{4,8})(\d{4})$/);
      if (!match) return null;
      return {
        prefijo: match[1],
        lote: match[2],
        peso: parseFloat(match[3]) / 100, // Dividir por 100 para obtener kg
        unidad: null
      };
    }
  },
  // Tipo 2: EAN con unidades (prefijo + lote + unidades)  
  TIPO_2: {
    pattern: /^(\d{3})(\w{4,8})U(\d{3})$/,
    descripcion: 'Prefijo(3) + Lote(4-8) + U + Unidades(3)',
    extraer: (codigo) => {
      const match = codigo.match(/^(\d{3})(\w{4,8})U(\d{3})$/);
      if (!match) return null;
      return {
        prefijo: match[1],
        lote: match[2],
        peso: null,
        unidad: parseInt(match[3])
      };
    }
  },
  // Tipo 3: EAN mixto (prefijo + lote + peso + unidades)
  TIPO_3: {
    pattern: /^(\d{2})(\w{4,6})(\d{3})(\d{2})$/,
    descripcion: 'Prefijo(2) + Lote(4-6) + Peso(3) + Unidades(2)',
    extraer: (codigo) => {
      const match = codigo.match(/^(\d{2})(\w{4,6})(\d{3})(\d{2})$/);
      if (!match) return null;
      return {
        prefijo: match[1],
        lote: match[2],
        peso: parseFloat(match[3]) / 100,
        unidad: parseInt(match[4])
      };
    }
  }
};

// 🆕 FUNCIÓN PARA PROCESAR CÓDIGOS EAN
function procesarCodigoEAN(codigo) {
  if (!codigo || typeof codigo !== 'string') return null;
  
  const codigoLimpio = codigo.trim().toUpperCase();
  
  // Probar cada tipo de EAN configurado
  for (const [tipo, config] of Object.entries(EAN_CONFIG)) {
    if (config.pattern.test(codigoLimpio)) {
      const resultado = config.extraer(codigoLimpio);
      if (resultado) {
        return {
          ...resultado,
          tipo,
          codigoOriginal: codigo,
          valido: true
        };
      }
    }
  }
  
  return {
    codigoOriginal: codigo,
    valido: false,
    error: 'Formato EAN no reconocido'
  };
}

// 🆕 COMPONENTE LECTOR EAN
function LectorEAN({ onLecturaEAN, disabled = false }) {
  const [inputEAN, setInputEAN] = useState('');
  const [ultimaLectura, setUltimaLectura] = useState(null);
  const inputRef = useRef(null);

  const procesarEAN = () => {
    if (!inputEAN.trim()) return;
    
    const resultado = procesarCodigoEAN(inputEAN);
    setUltimaLectura(resultado);
    
    if (resultado.valido && onLecturaEAN) {
      onLecturaEAN(resultado);
      setInputEAN(''); // Limpiar después de procesar
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      procesarEAN();
    }
  };

  return (
    <div className="lector-ean-container" style={{
      background: '#f8f9fa',
      border: '2px solid #e9ecef',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px'
      }}>
        <span style={{ fontWeight: 'bold', color: '#495057' }}>📱 Lector EAN:</span>
        <input
          ref={inputRef}
          type="text"
          value={inputEAN}
          onChange={(e) => setInputEAN(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escanear o introducir código EAN..."
          disabled={disabled}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <button
          onClick={procesarEAN}
          disabled={disabled || !inputEAN.trim()}
          style={{
            padding: '8px 16px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        >
          Procesar
        </button>
      </div>
      
      {ultimaLectura && (
        <div style={{
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          background: ultimaLectura.valido ? '#d4edda' : '#f8d7da',
          color: ultimaLectura.valido ? '#155724' : '#721c24',
          border: ultimaLectura.valido ? '1px solid #c3e6cb' : '1px solid #f5c6cb'
        }}>
          {ultimaLectura.valido ? (
            <div>
              ✅ <strong>EAN procesado:</strong><br/>
              Lote: {ultimaLectura.lote}, 
              {ultimaLectura.peso && ` Peso: ${ultimaLectura.peso}kg`}
              {ultimaLectura.unidad && ` Unidades: ${ultimaLectura.unidad}`}
            </div>
          ) : (
            <div>❌ <strong>Error:</strong> {ultimaLectura.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

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
  const { buscarProductos } = useProductos();
  const [sugerencias, setSugerencias] = React.useState([]);
  const [buscando, setBuscando] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(linea.producto || '');
  const [mostrarSugerencias, setMostrarSugerencias] = React.useState(false);
  const producto = sugerencias.find(p => p.nombre === linea.producto) || productos.find(p => p.nombre === linea.producto);
  const { lotes, loading, error } = useLotesDisponibles(producto?._id);

  // 🔧 MEJORADO: Búsqueda más inteligente de productos
  React.useEffect(() => {
    // No buscar si el input está vacío o es muy corto
    if (!inputValue || inputValue.length < 3) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // 🔧 CORREGIDO: Solo buscar si realmente necesitamos sugerencias
    // No buscar si ya tenemos un producto válido seleccionado
    const productoExacto = productos.find(p => p.nombre === inputValue);
    if (productoExacto) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    let cancelado = false;
    setBuscando(true);
    
    buscarProductos(inputValue).then(res => {
      if (!cancelado) {
        // 🔧 MEJORADO: Filtrar resultados más relevantes
        const resultadosFiltrados = res.filter(p => 
          p.nombre.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 8); // Limitar a 8 resultados
        
        setSugerencias(resultadosFiltrados);
        setMostrarSugerencias(resultadosFiltrados.length > 0);
      }
    }).finally(() => { 
      if (!cancelado) setBuscando(false); 
    });
    
    return () => { cancelado = true; };
  }, [inputValue, productos, buscarProductos]);

  // 🆕 FUNCIÓN PARA PROCESAR LECTURA EAN EN ESTA LÍNEA
  const procesarLecturaEAN = (datosEAN) => {
    if (!datosEAN.valido) return;
    
    // Aplicar datos del EAN a la línea actual
    if (datosEAN.lote) {
      actualizarLinea(idx, 'lote', datosEAN.lote);
    }
    
    if (datosEAN.peso !== null && datosEAN.peso > 0) {
      actualizarLinea(idx, 'peso', datosEAN.peso);
    }
    
    if (datosEAN.unidad !== null && datosEAN.unidad > 0) {
      actualizarLinea(idx, 'cantidadEnviada', datosEAN.unidad);
    }
  };

  // 🔧 MEJORADO: Manejo del modal de peso sin borrar el valor actual
  const handleAbrirModalPeso = () => {
    if (typeof onAbrirModalPeso === 'function') {
      // Pasar el peso actual como base, no como valor a sobrescribir
      const pesoBase = linea.peso || 0;
      const cantidadBase = linea.cantidad || 1;
      
      onAbrirModalPeso(idx, pesoBase, cantidadBase, (nuevosPesos) => {
        // Callback que recibe los nuevos pesos y los suma al existente
        const pesoTotal = pesoBase + nuevosPesos.reduce((acc, p) => acc + (parseFloat(p) || 0), 0);
        actualizarLinea(idx, 'peso', pesoTotal);
      });
    }
  };

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
        {/* 🆕 LECTOR EAN POR LÍNEA */}
        <LectorEAN 
          onLecturaEAN={procesarLecturaEAN}
          disabled={!linea.producto}
        />
        
        <div className="form-group" style={{ position: 'relative' }}>
          <label htmlFor={`producto-${idx}`}>Producto</label>
          <input
            id={`producto-${idx}`}
            autoComplete="off"
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              actualizarLinea(idx, 'producto', e.target.value);
              // 🔧 MEJORADO: Control más fino de cuándo mostrar sugerencias
              if (e.target.value.length >= 3) {
                setMostrarSugerencias(true);
              } else {
                setMostrarSugerencias(false);
              }
            }}
            onFocus={() => {
              // 🔧 CORREGIDO: Solo mostrar sugerencias si realmente las necesitamos
              if (inputValue && inputValue.length >= 3 && sugerencias.length > 0) {
                setMostrarSugerencias(true);
              }
            }}
            onBlur={() => {
              // Delay para permitir clics en sugerencias
              setTimeout(() => setMostrarSugerencias(false), 200);
            }}
            placeholder="Nombre del producto o referencia"
            className="producto-nombre-input"
            style={{ zIndex: 20 }}
          />
          {buscando && <div className="sugerencias-dropdown">Buscando...</div>}
          {mostrarSugerencias && sugerencias.length > 0 && (
            <ul className="sugerencias-dropdown" style={{ 
              position: 'absolute', 
              top: '100%', 
              left: 0, 
              right: 0, 
              background: '#fff', 
              border: '1px solid #ccc', 
              zIndex: 30, 
              maxHeight: 180, 
              overflowY: 'auto', 
              margin: 0, 
              padding: 0, 
              listStyle: 'none',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {sugerencias.map(prod => (
                <li
                  key={prod._id || prod.referencia || prod.nombre}
                  style={{ 
                    padding: '8px 12px', 
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseDown={() => {
                    setInputValue(prod.nombre);
                    actualizarLinea(idx, 'producto', prod.nombre);
                    setSugerencias([]);
                    setMostrarSugerencias(false);
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  <strong>{prod.nombre}</strong>
                  {prod.referencia && <span style={{color: '#666', fontSize: '12px'}}> ({prod.referencia})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor={`cantidad-${idx}`}>Cant. pedida</label>
            <input
              id={`cantidad-${idx}`}
              type="number"
              step="any"
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
              {/* 🔧 MEJORADO: Botón de suma de pesos mejorado */}
              {typeof onAbrirModalPeso === 'function' && !linea.esComentario &&
                Number(linea.cantidad) >= 2 && Number(linea.cantidad) < 100 && (
                  <button
                    type="button"
                    className="btn-add-peso"
                    title="Sumar pesos individuales (se añadirán al peso actual)"
                    onClick={handleAbrirModalPeso}
                  >
                    Σ+
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

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
  
  // 🆕 ESTADO PARA LECTOR EAN GLOBAL
  const [modoEANGlobal, setModoEANGlobal] = useState(false);
  const [lineaSeleccionadaEAN, setLineaSeleccionadaEAN] = useState(null);

  // 🆕 ESTADO PARA MODAL PESO
  const [modalPeso, setModalPeso] = useState({
    visible: false,
    indiceLinea: -1,
    nombreProducto: '',
    peso: 0,
    pesoAdicional: 0
  });

  // 🆕 FUNCIÓN PARA PROCESAR EAN GLOBAL
  const procesarEANGlobal = useCallback((datosEAN) => {
    if (!datosEAN.valido) return;
    
    if (lineaSeleccionadaEAN !== null) {
      // Aplicar a línea específica seleccionada usando setLineas directamente
      setLineas(prev => {
        if (!prev[lineaSeleccionadaEAN]) return prev;
        
        const nuevas = [...prev];
        const lineaObjetivo = { ...nuevas[lineaSeleccionadaEAN] };
        
        if (datosEAN.lote) {
          lineaObjetivo.lote = datosEAN.lote;
        }
        if (datosEAN.peso !== null && datosEAN.peso > 0) {
          lineaObjetivo.peso = datosEAN.peso;
        }
        if (datosEAN.unidad !== null && datosEAN.unidad > 0) {
          lineaObjetivo.cantidadEnviada = datosEAN.unidad;
        }
        
        nuevas[lineaSeleccionadaEAN] = lineaObjetivo;
        return nuevas;
      });
      
      // Desseleccionar línea después de aplicar (diferido para evitar setState durante render)
      setTimeout(() => setLineaSeleccionadaEAN(null), 0);
    } else {
      // 🆕 MODO AUTOMÁTICO: Buscar primera línea que necesite estos datos
      setLineas(prev => {
        const indicePrimeraLineaVacia = prev.findIndex(linea => 
          !linea.esComentario && 
          linea.producto && 
          (!linea.lote || (datosEAN.peso && !linea.peso) || (datosEAN.unidad && !linea.cantidadEnviada))
        );
        
        if (indicePrimeraLineaVacia >= 0) {
          const nuevas = [...prev];
          const lineaObjetivo = { ...nuevas[indicePrimeraLineaVacia] };
          
          if (datosEAN.lote && !lineaObjetivo.lote) {
            lineaObjetivo.lote = datosEAN.lote;
          }
          if (datosEAN.peso !== null && datosEAN.peso > 0 && !lineaObjetivo.peso) {
            lineaObjetivo.peso = datosEAN.peso;
          }
          if (datosEAN.unidad !== null && datosEAN.unidad > 0 && !lineaObjetivo.cantidadEnviada) {
            lineaObjetivo.cantidadEnviada = datosEAN.unidad;
          }
          
          nuevas[indicePrimeraLineaVacia] = lineaObjetivo;
          return nuevas;
        }
        return prev;
      });
    }
  }, [lineaSeleccionadaEAN]);

  // 🆕 FUNCIONES PARA MODAL PESO INTERNO
  const handleAbrirModalPeso = (idx, nombreProducto, pesoActual) => {
    const linea = lineas[idx];
    if (!linea) return;
    
    setModalPeso({
      visible: true,
      indiceLinea: idx,
      nombreProducto: nombreProducto || linea.producto || 'Sin especificar',
      peso: parseFloat(pesoActual || linea.peso || 0),
      pesoAdicional: 0
    });
  };

  const cerrarModalPeso = () => {
    setModalPeso({
      visible: false,
      indiceLinea: -1,
      nombreProducto: '',
      peso: 0,
      pesoAdicional: 0
    });
  };

  const confirmarModalPeso = () => {
    const pesoTotal = (modalPeso.peso || 0) + (modalPeso.pesoAdicional || 0);
    actualizarLinea(modalPeso.indiceLinea, 'peso', pesoTotal);
    cerrarModalPeso();
  };

  // 🔧 MEJORADO: Modal de peso que no borra el valor actual
  const handleAbrirModalPesoOriginal = (idx, pesoActual, cantidad, callback) => {
    if (typeof onAbrirModalPeso === 'function') {
      // Crear wrapper que preserve el comportamiento mejorado
      const modalWrapper = (indice, pesoBase, cant) => {
        // Llamar al modal original pero con nuestro callback mejorado
        onAbrirModalPeso(indice, pesoBase, cant, (nuevosPesos) => {
          if (callback && typeof callback === 'function') {
            callback(nuevosPesos);
          } else {
            // Comportamiento por defecto mejorado: sumar al peso actual
            const pesoTotal = (pesoBase || 0) + nuevosPesos.reduce((acc, p) => acc + (parseFloat(p) || 0), 0);
            actualizarLinea(idx, 'peso', pesoTotal);
          }
        });
      };
      
      modalWrapper(idx, pesoActual || 0, cantidad);
    }
  };

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
    // Ajustar línea seleccionada si es necesario
    if (lineaSeleccionadaEAN === idx) {
      setLineaSeleccionadaEAN(null);
    } else if (lineaSeleccionadaEAN > idx) {
      setLineaSeleccionadaEAN(lineaSeleccionadaEAN - 1);
    }
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
          {/* 🆕 BOTÓN LECTOR EAN GLOBAL */}
          <button 
            className={`btn-info ${modoEANGlobal ? 'active' : ''}`}
            onClick={() => setModoEANGlobal(!modoEANGlobal)}
            title="Activar/desactivar lector EAN global"
          >
            📱 EAN {modoEANGlobal ? 'ON' : 'OFF'}
          </button>
          
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

      {/* 🆕 LECTOR EAN GLOBAL */}
      {modoEANGlobal && (
        <div style={{ 
          background: '#e8f4fd', 
          border: '2px solid #007bff', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '16px' 
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '12px'
          }}>
            <strong style={{ color: '#0056b3' }}>🌐 Lector EAN Global</strong>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#495057' }}>Línea objetivo:</span>
              <select
                value={lineaSeleccionadaEAN || ''}
                onChange={(e) => setLineaSeleccionadaEAN(e.target.value ? parseInt(e.target.value) : null)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ced4da'
                }}
              >
                <option value="">Automático</option>
                {lineas.map((linea, idx) => (
                  !linea.esComentario && (
                    <option key={idx} value={idx}>
                      Línea {idx + 1}: {linea.producto || 'Sin producto'}
                    </option>
                  )
                ))}
              </select>
            </div>
          </div>
          <LectorEAN 
            onLecturaEAN={procesarEANGlobal}
            disabled={loading}
          />
          {lineaSeleccionadaEAN !== null && (
            <div style={{ 
              fontSize: '12px', 
              color: '#0056b3', 
              marginTop: '8px' 
            }}>
              ℹ️ Los datos EAN se aplicarán a la línea {lineaSeleccionadaEAN + 1}
            </div>
          )}
        </div>
      )}

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
          <div key={idx} style={{ position: 'relative' }}>
            {/* 🆕 INDICADOR DE LÍNEA SELECCIONADA PARA EAN */}
            {lineaSeleccionadaEAN === idx && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#007bff',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
                zIndex: 10
              }}>
                📱
              </div>
            )}
            <LineaPedido
              linea={linea}
              idx={idx}
              productos={productos}
              actualizarLinea={actualizarLinea}
              borrarLinea={borrarLinea}
              onAbrirModalPeso={handleAbrirModalPeso}
            />
          </div>
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
        
        {/* 🆕 INFORMACIÓN SOBRE FORMATOS EAN SOPORTADOS */}
        <div style={{
          marginLeft: 'auto',
          fontSize: '12px',
          color: '#6c757d',
          textAlign: 'right',
          lineHeight: '1.3'
        }}>
          <strong>Formatos EAN soportados:</strong><br/>
          • Tipo 1: Prefijo(3) + Lote(4-8) + Peso(4)<br/>
          • Tipo 2: Prefijo(3) + Lote(4-8) + U + Unidades(3)<br/>
          • Tipo 3: Prefijo(2) + Lote(4-6) + Peso(3) + Unidades(2)
        </div>
      </div>

      {/* 🆕 MODAL PESO MEJORADO */}
      {modalPeso.visible && (
        <div className="modal-overlay">
          <div className="modal-peso-fabrica">
            <div className="modal-header">
              <h4>📦 Configurar Peso - Línea {modalPeso.indiceLinea + 1}</h4>
              <button className="btn-close" onClick={cerrarModalPeso}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-producto">
                <strong>Producto:</strong> {modalPeso.nombreProducto || 'Sin especificar'}
              </div>
              <div className="input-group">
                <label>Peso actual (kg):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modalPeso.peso}
                  onChange={(e) => setModalPeso(prev => ({
                    ...prev,
                    peso: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              <div className="input-group">
                <label>Peso adicional (kg):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={modalPeso.pesoAdicional}
                  onChange={(e) => setModalPeso(prev => ({
                    ...prev,
                    pesoAdicional: parseFloat(e.target.value) || 0
                  }))}
                  placeholder="0.00"
                />
              </div>
              <div className="peso-total">
                <strong>Total: {((modalPeso.peso || 0) + (modalPeso.pesoAdicional || 0)).toFixed(2)} kg</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-default" onClick={cerrarModalPeso}>
                Cancelar
              </button>
              <button className="btn-success" onClick={confirmarModalPeso}>
                Aplicar Peso
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
