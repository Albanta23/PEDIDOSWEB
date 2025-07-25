import React, { useState, useEffect, useMemo } from "react";
import TransferenciasPanel from './TransferenciasPanel';
import { crearPedido, actualizarPedido, obtenerPedidos } from '../services/pedidosService';
import { FORMATOS_PEDIDO } from '../configFormatos';
import jsPDF from 'jspdf';
import axios from 'axios';
import { useProductos } from './ProductosContext';
import { cabeceraPDF, piePDF } from '../utils/exportPDFBase';
import './PedidoEditorFabrica.css'; // Reutilizar estilos
import '../styles/datalist-fix.css'; // Importar arreglos para datalist
import '../styles/pedido-list.css'; // Estilos específicos para PedidoList
import '../styles/datalist-position.css'; // Importar mejoras de posicionamiento para datalist

// Definir API_URL global seguro para todas las llamadas
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';

// Constante global para el ID de la tienda de clientes
const TIENDA_CLIENTES_ID = 'PEDIDOS_CLIENTES';

// --- Generar PDF de la lista de proveedor ---
async function exportarProveedorPDF(lineasProveedor, tiendaActual) {
  const doc = new jsPDF();
  await cabeceraPDF(doc);
  // ... (el resto de la lógica de exportarProveedorPDF debe ir aquí, pero si solo es un stub, cerramos la función)
  // Si la función está incompleta, al menos cerrarla para evitar errores de sintaxis
  // Si hay más lógica, debe ser añadida aquí
  return doc;
}

export default function PedidoList({ pedidos, onModificar, onBorrar, onEditar, modo, tiendaActual, onRefrescarPedidos }) {
  const { productos, cargando } = useProductos();
  const [creandoNuevo, setCreandoNuevo] = useState(false); // Controla si el editor de borrador está activo
  const [lineasEdit, setLineasEdit] = useState([]);
  const [mensajeFeedback, setMensajeFeedback] = useState({ texto: '', tipo: '' }); // {texto: '', tipo: 'success'/'error'}

  const [mostrarModalProveedor, setMostrarModalProveedor] = useState(false);
  const [enviandoProveedor, setEnviandoProveedor] = useState(false);
  const [mensajeProveedor, setMensajeProveedor] = useState("");
  const [mostrarHistorialProveedor, setMostrarHistorialProveedor] = useState(false);
  const [historialProveedor, setHistorialProveedor] = useState([]);
  const [forzarTextoPlano, setForzarTextoPlano] = useState(false);
  const [envioExpandido, setEnvioExpandido] = useState(null);
  const [periodoHistorial, setPeriodoHistorial] = useState('semana');
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState('');

  // Estado para el modal de búsqueda múltiple
  const [mostrarModalBusquedaMultiple, setMostrarModalBusquedaMultiple] = useState(false);


  const getStorageKey = () => `pedido_borrador_${tiendaActual?.id || 'default'}`;

  useEffect(() => {
    if (!tiendaActual?.id) return;
    const key = getStorageKey();
    const lineasGuardadas = localStorage.getItem(key);
    if (lineasGuardadas) {
      try {
        const lineas = JSON.parse(lineasGuardadas);
        if (lineas && lineas.length > 0) {
          setLineasEdit(lineas);
          setCreandoNuevo(true); // Abrir editor si hay borrador
        } else {
          setLineasEdit([]); // Asegurar que esté vacío si no hay nada válido
        }
      } catch (error) {
        console.warn('Error al cargar líneas desde localStorage:', error);
        localStorage.removeItem(key); // Limpiar borrador corrupto
        setLineasEdit([]);
      }
    } else {
      setLineasEdit([]); // No hay borrador, iniciar vacío
    }
  }, [tiendaActual?.id]);

  useEffect(() => {
    if (creandoNuevo && tiendaActual?.id && lineasEdit.length > 0) {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(lineasEdit));
    } else if (creandoNuevo && tiendaActual?.id && lineasEdit.length === 0) {
      // Si se borran todas las líneas, limpiar el storage
      const key = getStorageKey();
      localStorage.removeItem(key);
    }
  }, [lineasEdit, tiendaActual?.id, creandoNuevo]);

  const limpiarStorage = () => {
    if (tiendaActual?.id) {
      const key = getStorageKey();
      localStorage.removeItem(key);
    }
  };

  const handleCrearNuevoPedido = () => {
    setCreandoNuevo(true);
    if (lineasEdit.length === 0) {
      setLineasEdit([{ producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null }]);
    }
  };

  const obtenerFamiliaProducto = (nombreProducto) => {
    const prod = productos.find(p => p.nombre === nombreProducto);
    return prod?.nombreFamilia || prod?.familia || '';
  };

  const ordenarLineasPorFamilia = (lineas) => {
    return [...lineas].sort((a, b) => {
      const aEsComentario = a.esComentario || false;
      const bEsComentario = b.esComentario || false;
      if (aEsComentario && bEsComentario) return 0;
      if (aEsComentario) return 1;
      if (bEsComentario) return -1;
      const famA = obtenerFamiliaProducto(a.producto)?.toLowerCase() || '';
      const famB = obtenerFamiliaProducto(b.producto)?.toLowerCase() || '';
      if (famA < famB) return -1;
      if (famA > famB) return 1;
      const nombreA = a.producto?.toLowerCase() || '';
      const nombreB = b.producto?.toLowerCase() || '';
      if (nombreA < nombreB) return -1;
      if (nombreA > nombreB) return 1;
      return 0;
    });
  };

  const mostrarFeedback = (texto, tipo, duracion = 3000) => {
    setMensajeFeedback({ texto, tipo });
    setTimeout(() => setMensajeFeedback({ texto: '', tipo: '' }), duracion);
  };

  const handleGuardarLineas = () => {
    if (lineasEdit.length === 0) {
      mostrarFeedback('No hay líneas para guardar como borrador.', 'error');
      return;
    }
    const lineasParaGuardar = lineasEdit.filter(l => (l.esComentario && typeof l.comentario === 'string') || (!l.esComentario && l.producto && l.cantidad > 0));
    if (lineasParaGuardar.length === 0) {
      mostrarFeedback('No hay líneas válidas para guardar.', 'error');
      return;
    }
    // La lógica de guardar en localStorage ya está en el useEffect de lineasEdit
    mostrarFeedback('Borrador guardado localmente.', 'success');
  };
  
  const handleGuardarYCerrar = () => {
    if (lineasEdit.length === 0) {
      mostrarFeedback('No hay líneas para guardar como borrador.', 'error');
      return;
    }
    const lineasParaGuardar = lineasEdit.filter(l => (l.esComentario && typeof l.comentario === 'string') || (!l.esComentario && l.producto && l.cantidad > 0));
    if (lineasParaGuardar.length === 0) {
      mostrarFeedback('No hay líneas válidas para guardar.', 'error');
      return;
    }
    // La lógica de guardar en localStorage ya está en el useEffect de lineasEdit
    mostrarFeedback('Borrador guardado localmente y editor cerrado.', 'success');
    setCreandoNuevo(false);
  };

  const handleConfirmarYEnviarPedido = async () => {
    const lineasParaEnviar = lineasEdit.filter(l => (l.esComentario && typeof l.comentario === 'string') || (!l.esComentario && l.producto && l.cantidad > 0));
    if (lineasParaEnviar.length === 0) {
      mostrarFeedback('El pedido no tiene líneas válidas.', 'error');
      return;
    }
    const lineasOrdenadasYFiltradas = ordenarLineasPorFamilia(lineasParaEnviar);
    try {
      const nuevoPedido = {
        estado: 'enviado',
        fechaPedido: new Date().toISOString(),
        tiendaId: tiendaActual?.id,
        tienda: tiendaActual,
        lineas: lineasOrdenadasYFiltradas.map(l => ({
          esComentario: !!l.esComentario,
          comentario: l.comentario || '',
          producto: l.esComentario ? undefined : l.producto,
          cantidad: l.esComentario ? undefined : l.cantidad,
          formato: l.esComentario ? undefined : l.formato,
          peso: l.esComentario ? undefined : (l.peso || null), // Incluir peso
          cantidadEnviada: l.esComentario ? undefined : l.cantidad
        }))
      };
      await crearPedido(nuevoPedido);
      setLineasEdit([]);
      setCreandoNuevo(false);
      limpiarStorage();
      mostrarFeedback('Pedido enviado correctamente a fábrica.', 'success');
      if (typeof onRefrescarPedidos === 'function') {
        await onRefrescarPedidos();
      }
    } catch (error) {
      console.error('Error al enviar el pedido:', error);
      mostrarFeedback('Error al enviar el pedido.', 'error');
    }
  };

  const handleAgregarLinea = () => {
    const nuevas = [...lineasEdit, { producto: '', cantidad: 1, formato: FORMATOS_PEDIDO[0], comentario: '', peso: null }];
    setLineasEdit(ordenarLineasPorFamilia(nuevas));
  };

  const handleAgregarLineaComentario = () => {
    const nuevas = [...lineasEdit, { esComentario: true, comentario: '' }];
    setLineasEdit(nuevas);
  };

  const handleEliminarLinea = (idx) => {
    const nuevas = lineasEdit.filter((_, i) => i !== idx);
    setLineasEdit(ordenarLineasPorFamilia(nuevas));
  };

  const handleLineaChange = (idx, campo, valor) => {
    const nuevasLineas = lineasEdit.map((linea, i) => {
      if (i === idx) {
        let nuevoValor = valor;
        if (campo === 'peso' || campo === 'cantidad') {
          nuevoValor = valor === '' ? null : parseFloat(valor);
          if (isNaN(nuevoValor)) nuevoValor = linea[campo]; // Mantener valor anterior si no es número válido
        }
        return { ...linea, [campo]: nuevoValor };
      }
      return linea;
    });
    setLineasEdit(ordenarLineasPorFamilia(nuevasLineas));
  };

  const handleCancelarEdicion = () => {
    // Preguntar si desea descartar cambios si hay líneas
    if (lineasEdit.length > 0) {
      if (window.confirm("¿Descartar el borrador actual? Los cambios no guardados se perderán.")) {
        setLineasEdit([]);
        limpiarStorage();
        setCreandoNuevo(false);
      }
    } else {
      setCreandoNuevo(false);
    }
  };

  const REFERENCIAS_CERDO = ["lomo", "panceta", "solomillos", "costilla", "chuletero", "carrilleras", "pies", "espinazo", "secreto", "papada", "jamon", "paleta", "paleta tipo york", "maza de jamon"];
  const getProveedorKey = () => `proveedor_despiece_${tiendaActual?.id || 'default'}`;
  const [lineasProveedor, setLineasProveedor] = useState([]);

  useEffect(() => {
    if (mostrarModalProveedor && tiendaActual?.id) {
      localStorage.setItem(getProveedorKey(), JSON.stringify(lineasProveedor));
    }
  }, [lineasProveedor, mostrarModalProveedor, tiendaActual?.id]);

  const handleProveedorLineaChange = (idx, campo, valor) => setLineasProveedor(lineasProveedor.map((l, i) => i === idx ? { ...l, [campo]: valor } : l));
  const handleProveedorAgregarLinea = () => setLineasProveedor([...lineasProveedor, { referencia: '', cantidad: '', unidad: 'kg' }]);
  const handleProveedorEliminarLinea = (idx) => setLineasProveedor(lineasProveedor.filter((_, i) => i !== idx));
  const handleProveedorLimpiar = () => { setLineasProveedor([]); localStorage.removeItem(getProveedorKey()); };

  async function enviarProveedorMailjet() {
    if (tiendaActual?.id === TIENDA_CLIENTES_ID) {
      setMensajeProveedor('No se puede enviar lista a proveedor para clientes directos.');
      alert('No se puede enviar lista a proveedor para clientes directos.');
      setEnviandoProveedor(false);
      return;
    }
    setEnviandoProveedor(true);
    setMensajeProveedor("");
    try {
      const doc = new jsPDF();
      await cabeceraPDF(doc);
      let y = 48;
      doc.setFontSize(20); doc.text('Pedidos a Proveedores', 105, y, { align: 'center' }); y += 12;
      doc.setFontSize(14);
      if (tiendaActual?.nombre) { doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y); y += 9; }
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y); y += 11;
      doc.setFontSize(14); doc.text('Referencia', 14, y); doc.text('Cantidad', 70, y); doc.text('Unidad', 110, y); y += 8;
      doc.setLineWidth(0.3); doc.line(14, y, 150, y); y += 5;
      doc.setFontSize(13);
      for (const l of lineasProveedor) {
        if (l.referencia && l.cantidad) {
          doc.text(String(l.referencia).toUpperCase(), 14, y); doc.text(String(l.cantidad), 70, y); doc.text(String(l.unidad || 'kg'), 110, y);
          y += 9;
          if (y > 280) { doc.addPage(); await cabeceraPDF(doc); y = 48; }
        }
      }
      await piePDF(doc);
      let pdfBase64 = doc.output('datauristring');
      if (pdfBase64.startsWith('data:')) pdfBase64 = pdfBase64.substring(pdfBase64.indexOf(',') + 1);

      const lineasProveedorMayus = lineasProveedor.map(l => ({ ...l, referencia: l.referencia ? l.referencia.toUpperCase() : '' }));
      let tiendaIdEnvio = tiendaActual?.id;
      if (typeof tiendaIdEnvio === 'string' && tiendaIdEnvio.trim().toLowerCase() === 'clientes') tiendaIdEnvio = TIENDA_CLIENTES_ID;
      
      const bodyData = { tienda: tiendaActual?.nombre || '', tiendaId: tiendaIdEnvio, fecha: new Date().toLocaleDateString(), lineas: lineasProveedorMayus, pdfBase64, forzarTextoPlano };
      // CORRECCIÓN: evitar duplicidad /api/api/enviar-proveedor-v2
      const endpoint = API_URL.endsWith('/api') ? `${API_URL}/enviar-proveedor-v2` : `${API_URL}/api/enviar-proveedor-v2`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyData) });

      if (res.ok) { setMensajeProveedor("¡Pedido enviado al proveedor!"); handleProveedorLimpiar(); }
      else { setMensajeProveedor("Error al enviar el email al proveedor."); }
    } catch (e) { setMensajeProveedor("Error al generar o enviar el PDF."); }
    setEnviandoProveedor(false);
  }

  const cargarHistorialProveedor = async () => {
    if (!tiendaActual?.id) return;
    setCargandoHistorial(true); setErrorHistorial('');
    try {
      let tiendaIdHistorial = tiendaActual.id;
      if (typeof tiendaIdHistorial === 'string' && tiendaIdHistorial.trim().toLowerCase() === 'clientes') tiendaIdHistorial = TIENDA_CLIENTES_ID;
      const res = await fetch(`${API_URL}/api/historial-proveedor?tiendaId=${encodeURIComponent(tiendaIdHistorial)}&periodo=${periodoHistorial}`);
      const data = await res.json();
      if (data.ok) setHistorialProveedor(data.historial);
      else setErrorHistorial(data.error || 'Error al cargar historial');
    } catch (e) { setErrorHistorial('Error de red'); }
    setCargandoHistorial(false);
  };

  useEffect(() => { if (mostrarHistorialProveedor) cargarHistorialProveedor(); }, [mostrarHistorialProveedor, periodoHistorial, tiendaActual?.id]);

  function normalizarFormato(formato) {
    if (!formato) return 'Bolsas';
    const mapa = { 'kg': 'Kilos', 'uds': 'Unidades', 'caja': 'Cajas', 'piezas': 'Bolsas', 'bolsa': 'Bolsas', 'bolsas': 'Bolsas', 'kilos': 'Kilos', 'unidades': 'Unidades', 'cajas': 'Cajas' };
    const f = String(formato).toLowerCase();
    return mapa[f] || formato;
  }

  useEffect(() => {
    if (!tiendaActual?.id) return;
    const key = getProveedorKey();
    const guardadas = localStorage.getItem(key);
    if (guardadas) {
      try {
        const arr = JSON.parse(guardadas);
        if (Array.isArray(arr) && arr.length > 0) setLineasProveedor(arr);
        else setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' })));
      } catch (e) { setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' }))); }
    } else { setLineasProveedor(REFERENCIAS_CERDO.map(ref => ({ referencia: ref, cantidad: '', unidad: 'kg' }))); }
  }, [tiendaActual?.id, mostrarModalProveedor]);

  const productoExiste = (valor) => { // Renombrada para claridad
    if (!valor || cargando) return true; // Asumir válido si no hay valor o productos están cargando
    return productos.some(p => (p.nombre && p.nombre.toLowerCase() === valor.toLowerCase()) || (p.referencia && String(p.referencia).toLowerCase() === String(valor).toLowerCase()));
  };

  const [busquedaMulti, setBusquedaMulti] = useState('');
  const [seleccionMulti, setSeleccionMulti] = useState([]);
  const [filtroFamiliaMulti, setFiltroFamiliaMulti] = useState('');

  const familiasUnicas = useMemo(() => {
    const setFamilias = new Set();
    productos.forEach(p => { if (p.familia || p.nombreFamilia) setFamilias.add(p.nombreFamilia || p.familia); });
    return Array.from(setFamilias).filter(Boolean).sort();
  }, [productos]);

  const productosFiltradosMulti = useMemo(() => {
    const texto = busquedaMulti.trim().toLowerCase();
    return productos.filter(p => {
      const coincideTexto = !texto || (p.nombre && p.nombre.toLowerCase().includes(texto)) || (p.referencia && String(p.referencia).toLowerCase().includes(texto));
      const coincideFamilia = !filtroFamiliaMulti || (p.nombreFamilia || p.familia) === filtroFamiliaMulti;
      return coincideTexto && coincideFamilia;
    });
  }, [busquedaMulti, filtroFamiliaMulti, productos]);

  const handleAnadirSeleccionados = () => {
    if (seleccionMulti.length === 0) return;
    const nuevasLineasDesdeSeleccion = seleccionMulti.map(nombreProd => ({
      producto: nombreProd,
      cantidad: 1,
      formato: FORMATOS_PEDIDO[0],
      comentario: '',
      peso: null
    }));
    const lineasCombinadas = [...lineasEdit, ...nuevasLineasDesdeSeleccion.filter(nl => !lineasEdit.some(le => le.producto === nl.producto))];
    setLineasEdit(ordenarLineasPorFamilia(lineasCombinadas));
    setSeleccionMulti([]);
    setBusquedaMulti('');
    setMostrarModalBusquedaMultiple(false); // Cerrar modal tras añadir
  };

  return (
    <div className="pedido-list-container"> {/* Contenedor principal para PedidoList */}
      {mensajeFeedback.texto && (
        <div className={`editor-feedback ${mensajeFeedback.tipo === 'success' ? 'feedback-success' : 'feedback-error'}`}>
          {mensajeFeedback.texto}
        </div>
      )}

      {!creandoNuevo && (
        <div className="actions-panel">
          <button onClick={handleCrearNuevoPedido} className="btn-primary-modern">
            <span role="img" aria-label="crear">📝</span> Crear Nuevo Pedido
          </button>
          <button onClick={() => setMostrarModalProveedor(true)} className="btn-secondary-modern">
            <img src="/logo_2.jpg" alt="Proveedor" style={{height:28,width:28,marginRight:8,verticalAlign:'middle',borderRadius:6}} /> Pedidos de Fresco (Proveedor)
          </button>
        </div>
      )}

      {creandoNuevo && (
        <div className="pedido-editor-fabrica-container tienda-editor-container"> {/* Reutilizar clase base y añadir una específica */}
          <div className="editor-header">
            <h3>Componer Nuevo Pedido para {tiendaActual?.nombre || 'Tienda'}</h3>
            <div className="editor-actions-main">
              <button onClick={handleGuardarLineas} className="btn-success">
                💾 Guardar Borrador
              </button>
              <button onClick={handleGuardarYCerrar} className="btn-info">
                💾 Guardar y Cerrar
              </button>
              <button onClick={handleConfirmarYEnviarPedido} className="btn-premium">
                🚀 Enviar a Fábrica
              </button>
              <button onClick={handleCancelarEdicion} className="btn-default">
                ✖️ Cancelar
              </button>
            </div>
          </div>

          <div className="editor-body">
            <button onClick={() => setMostrarModalBusquedaMultiple(true)} className="btn-info btn-full-width-mobile" style={{marginBottom: '16px'}}>
              🔍 Buscar y Añadir Varios Productos
            </button>

            {lineasEdit.length === 0 && (
              <div className="no-lineas-mensaje">
                Aún no has añadido líneas a este pedido. Utiliza los botones de abajo o la búsqueda múltiple.
              </div>
            )}

            {lineasEdit.map((linea, idx) => (
              linea.esComentario ? (
                <div key={`comment-${idx}`} className="linea-comentario-card">
                  <h4>📝 COMENTARIO</h4>
                  <div className="form-group">
                    <textarea
                      value={linea.comentario || ''}
                      onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                      placeholder="Escribe aquí tu comentario..."
                    />
                  </div>
                  <div className="linea-actions">
                    <button className="btn-danger" onClick={() => handleEliminarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
                  </div>
                </div>
              ) : (
                <div key={idx} className={`linea-pedido-card ${!productoExiste(linea.producto) && linea.producto ? 'producto-invalido-card' : ''}`}>
                  <div className="form-group">
                    <label htmlFor={`producto-tienda-${idx}`}>Producto</label>
                    <div className="producto-input-container">
                      {/* Espacio reservado para el datalist arriba del input */}
                      <div className="datalist-space"></div>
                      <input
                        id={`producto-tienda-${idx}`}
                        list="productos-lista-global-tienda"
                        value={linea.producto}
                        onChange={e => handleLineaChange(idx, 'producto', e.target.value)}
                        onKeyDown={e => {
                          // Si se presiona Enter, buscar producto por referencia exacta
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const valor = e.target.value.trim();
                            // Buscar producto por referencia exacta
                            const productoEncontrado = productos.find(p => p.referencia && 
                              String(p.referencia).toLowerCase() === String(valor).toLowerCase());
                            if (productoEncontrado) {
                              handleLineaChange(idx, 'producto', productoEncontrado.nombre);
                              // Enfocar el campo de cantidad después de seleccionar un producto
                              const cantidadInput = document.getElementById(`cantidad-tienda-${idx}`);
                              if (cantidadInput) cantidadInput.focus();
                            }
                          }
                        }}
                        onFocus={e => {
                          // Activar el espacio para datalist cuando el input obtiene el foco
                          const datalistSpace = e.target.previousSibling;
                          if (datalistSpace) {
                            datalistSpace.classList.add('active');
                          }
                        }}
                        onBlur={e => {
                          // Al perder foco, verificar si es una referencia exacta y desactivar espacio de datalist
                          const valor = e.target.value.trim();
                          const productoEncontrado = productos.find(p => p.referencia && 
                            String(p.referencia).toLowerCase() === String(valor).toLowerCase());
                          if (productoEncontrado) {
                            handleLineaChange(idx, 'producto', productoEncontrado.nombre);
                            // También enfocar el campo de cantidad después de seleccionar un producto por referencia
                            const cantidadInput = document.getElementById(`cantidad-tienda-${idx}`);
                            if (cantidadInput) cantidadInput.focus();
                          }
                          
                          // Desactivar el espacio para datalist
                          const datalistSpace = e.target.previousSibling;
                          if (datalistSpace) {
                            datalistSpace.classList.remove('active');
                          }
                        }}
                        placeholder="Nombre o referencia del producto"
                        className={`producto-nombre-input ${!productoExiste(linea.producto) && linea.producto ? 'input-error' : ''}`}
                      />
                      <datalist id="productos-lista-global-tienda">
                        {productos
                          .filter(prod => {
                            // Obtener el valor del input
                            const inputValue = linea.producto ? linea.producto.trim().toLowerCase() : '';
                            // Si el input está vacío, no mostrar nada
                            if (!inputValue || inputValue.length < 4) return false;
                            
                            // Verificar coincidencias de varias formas:
                            
                            // 1. Si la referencia coincide exactamente
                            if (prod.referencia && String(prod.referencia).toLowerCase() === inputValue) {
                              return true;
                            }
                            
                            // 2. Si el input tiene al menos 4 caracteres y coincide parcialmente con el nombre
                            if (prod.nombre && prod.nombre.toLowerCase().includes(inputValue)) {
                              return true;
                            }
                            
                            // 3. Verificar si hay coincidencia con palabras individuales de 4+ caracteres
                            const palabrasInput = inputValue.split(/\s+/).filter(palabra => palabra.length >= 4);
                            if (palabrasInput.length > 0 && prod.nombre) {
                              return palabrasInput.some(palabra => 
                                prod.nombre.toLowerCase().includes(palabra)
                              );
                            }
                            
                            return false;
                          })
                          .map(prod => (
                            <option key={prod._id || prod.referencia || prod.nombre} value={prod.nombre}>
                              {prod.nombre} {prod.referencia ? `(${prod.referencia})` : ''}
                            </option>
                          ))
                        }
                      </datalist>
                    </div>
                    {!productoExiste(linea.producto) && linea.producto && (
                      <small className="error-text">Producto no encontrado en la lista.</small>
                    )}
                    {!productoExiste(linea.producto) && linea.producto && (
                      <small className="error-text">Producto no encontrado en la lista.</small>
                    )}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor={`cantidad-tienda-${idx}`}>Cantidad</label>
                      <input
                        id={`cantidad-tienda-${idx}`}
                        type="number"
                        min="0"
                        step="any"
                        value={linea.cantidad === null || linea.cantidad === undefined ? '' : linea.cantidad}
                        onChange={e => handleLineaChange(idx, 'cantidad', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`formato-tienda-${idx}`}>Formato/Unidad</label>
                      <select
                        id={`formato-tienda-${idx}`}
                        value={normalizarFormato(linea.formato) || 'Bolsas'}
                        onChange={e => handleLineaChange(idx, 'formato', e.target.value)}
                      >
                        {FORMATOS_PEDIDO.map(f => (<option key={f} value={f}>{f}</option>))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`peso-tienda-${idx}`}>Peso (kg) (Opcional)</label>
                      <input
                        id={`peso-tienda-${idx}`}
                        type="number"
                        min="0"
                        step="any"
                        value={linea.peso === null || linea.peso === undefined ? '' : linea.peso}
                        onChange={e => handleLineaChange(idx, 'peso', e.target.value)}
                        placeholder="Ej: 0.5"
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label htmlFor={`comentarioLinea-tienda-${idx}`}>Comentario de línea (Opcional)</label>
                      <input
                        id={`comentarioLinea-tienda-${idx}`}
                        type="text"
                        value={linea.comentario || ''}
                        onChange={e => handleLineaChange(idx, 'comentario', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="linea-actions">
                    <button className="btn-danger" onClick={() => handleEliminarLinea(idx)} title="Eliminar línea">🗑 Eliminar Línea</button>
                  </div>
                </div>
              )
            ))}
          </div>

          <div className="editor-footer-actions">
            <button className="btn-secondary" onClick={handleAgregarLinea}>
              + Añadir Producto
            </button>
            <button className="btn-info" onClick={handleAgregarLineaComentario}>
              + Añadir Comentario
            </button>
          </div>
        </div>
      )}

      {mostrarModalBusquedaMultiple && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Buscar y Añadir Productos</h3>
              <button onClick={() => setMostrarModalBusquedaMultiple(false)} className="btn-close-modal">&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="busqueda-multi-input">Buscar por nombre o referencia:</label>
                <input
                  id="busqueda-multi-input"
                  type="text"
                  placeholder="Escribe para buscar..."
                  value={busquedaMulti}
                  onChange={e => setBusquedaMulti(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="filtro-familia-multi-select">Filtrar por familia:</label>
                <select id="filtro-familia-multi-select" value={filtroFamiliaMulti} onChange={e => setFiltroFamiliaMulti(e.target.value)}>
                  <option value="">Todas las familias</option>
                  {familiasUnicas.map(fam => (<option key={fam} value={fam}>{fam}</option>))}
                </select>
              </div>
              <div className="productos-seleccion-lista">
                {cargando && <p>Cargando productos...</p>}
                {!cargando && productosFiltradosMulti.length === 0 && <p>No se encontraron productos con esos criterios.</p>}
                {!cargando && productosFiltradosMulti.map(p => (
                  <label key={p._id || p.nombre} className="producto-seleccion-item">
                    <input
                      type="checkbox"
                      checked={seleccionMulti.includes(p.nombre)}
                      onChange={e => {
                        if (e.target.checked) setSeleccionMulti(arr => [...arr, p.nombre]);
                        else setSeleccionMulti(arr => arr.filter(n => n !== p.nombre));
                      }}
                    />
                    <span>{p.nombre} {p.referencia ? `(${p.referencia})` : ''}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <span>{seleccionMulti.length} producto(s) seleccionado(s)</span>
              <button onClick={handleAnadirSeleccionados} className="btn-premium" disabled={seleccionMulti.length === 0}>
                Añadir Seleccionados al Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El resto del componente (pedidos a proveedor, historial, etc.) se mantiene sin cambios visuales por ahora */}
      {/* ... (Modal Proveedor y Modal Historial Proveedor) ... */}
      {mostrarModalProveedor && (
        <div style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'#0007',zIndex:3000,display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 4px 32px #0004',minWidth:320,maxWidth:540,minHeight:420,maxHeight:'90vh',position:'relative',overflow:'auto'}}>
            <button onClick={()=>setMostrarModalProveedor(false)} style={{position:'absolute',top:12,right:12,background:'#dc3545',color:'#fff',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:700,cursor:'pointer'}}>Cerrar</button>
            <h2 style={{marginTop:0,marginBottom:16,fontSize:22,color:'#b71c1c',display:'flex',alignItems:'center'}}>
              <img src="/logo_2.jpg" alt="Proveedor" style={{height:32,width:32,marginRight:10,borderRadius:8}} />Lista para proveedor
            </h2>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',marginBottom:16,minWidth:400}}>
                <thead>
                  <tr style={{background:'#f8f9fa'}}>
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Referencia</th>
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Cantidad</th>
                    <th style={{padding:'8px 6px',borderBottom:'1px solid #ddd',textAlign:'left'}}>Unidad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lineasProveedor.length === 0 && (
                    <tr><td colSpan={3} style={{color:'#888',fontStyle:'italic',padding:10}}>No hay líneas. Añade una para comenzar.</td></tr>
                  )}
                  {lineasProveedor.map((linea, i) => (
                    <tr key={i}>
                      <td style={{padding:'6px'}}>
                        <input
                          value={linea.referencia ? linea.referencia.toUpperCase() : ''}
                          onChange={e => handleProveedorLineaChange(i, 'referencia', e.target.value.toUpperCase())}
                          placeholder="Referencia"
                          list={`referencias-cerdo-lista-${i}`}
                          style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}}
                        />
                        <datalist id={`referencias-cerdo-lista-${i}`}>
                          {REFERENCIAS_CERDO.map(ref => <option key={ref} value={ref} />)}
                        </datalist>
                      </td>
                      <td style={{padding:'6px'}}>
                        <input type="number" min="1" value={linea.cantidad} onChange={e => handleProveedorLineaChange(i, 'cantidad', Number(e.target.value))} style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}} />
                      </td>
                      <td style={{padding:'6px'}}>
                        <select value={linea.unidad || 'kg'} onChange={e => handleProveedorLineaChange(i, 'unidad', e.target.value)} style={{width:'100%',border:'1px solid #bbb',borderRadius:6,padding:'6px 8px'}}>
                          <option value="kg">kg</option>
                          <option value="uds">uds</option>
                        </select>
                      </td>
                      <td style={{padding:'6px'}}>
                        <button onClick={() => handleProveedorEliminarLinea(i)} style={{color:'#dc3545',background:'none',border:'none',cursor:'pointer',fontSize:20}} title="Eliminar línea">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'flex-end',alignItems:'center',marginBottom:8}}>
              <button onClick={handleProveedorAgregarLinea} className="btn-secondary" style={{padding:'7px 18px'}}>Añadir línea</button>
              <button onClick={handleProveedorLimpiar} className="btn-default" style={{padding:'7px 18px'}}>Limpiar</button>
              <button onClick={()=>exportarProveedorPDF(lineasProveedor, tiendaActual)} className="btn-info" style={{padding:'7px 18px'}}>
                Ver PDF
              </button>
              <button 
                onClick={enviarProveedorMailjet}
                disabled={enviandoProveedor || !!mensajeProveedor}
                aria-disabled={enviandoProveedor || !!mensajeProveedor}
                className="btn-premium"
                style={{
                  opacity: (enviandoProveedor || !!mensajeProveedor) ? 0.5 : 1,
                  cursor: (enviandoProveedor || !!mensajeProveedor) ? 'not-allowed' : 'pointer',
                  padding: 0,
                  border: 'none',
                  background: 'none',
                  boxShadow: 'none',
                  minWidth: 48,
                  minHeight: 48,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <img src="/logo_2.jpg" alt="Enviar al proveedor" style={{height:48,width:48,borderRadius:12,objectFit:'cover',boxShadow:'0 2px 8px #0002'}} />
                <span style={{fontSize:13,marginTop:4,color:'#333',fontWeight:500,letterSpacing:0.5}}>Enviar</span>
                {enviandoProveedor && <span style={{marginTop:6,fontWeight:600}}>Enviando...</span>}
              </button>
              <button onClick={()=>setMostrarHistorialProveedor(true)} className="btn-primary-modern" style={{marginLeft:8, padding:'7px 18px'}}>
                <span role="img" aria-label="historial" style={{marginRight:6}}>📦</span>Historial
              </button>
            </div>

            {mensajeProveedor && <div className={`editor-feedback ${mensajeProveedor.startsWith("Error") ? "feedback-error" : "feedback-success"}`} style={{marginTop:16}}>{mensajeProveedor}</div>}
            {mensajeProveedor && (
              <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
                <button onClick={() => { setMensajeProveedor(""); setMostrarModalProveedor(false); }} className="btn-primary-modern" style={{padding:'8px 24px'}}>Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {mostrarHistorialProveedor && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '700px'}}>
            <div className="modal-header">
              <h3>Historial de pedidos a proveedor</h3>
              <button onClick={()=>setMostrarHistorialProveedor(false)} className="btn-close-modal">&times;</button>
            </div>
            <div className="modal-body">
              <div style={{marginBottom:18,display:'flex',gap:12,alignItems:'center'}}>
                <label htmlFor="periodo-historial-select">Periodo:</label>
                <select id="periodo-historial-select" value={periodoHistorial} onChange={e=>setPeriodoHistorial(e.target.value)}>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                  <option value="año">Año</option>
                </select>
                <button onClick={cargarHistorialProveedor} className="btn-primary-modern" style={{marginLeft:10}}>Actualizar</button>
              </div>
              {cargandoHistorial && <p>Cargando historial...</p>}
              {errorHistorial && <div className="editor-feedback feedback-error">{errorHistorial}</div>}
              {!cargandoHistorial && !errorHistorial && (
                <table className="tabla-historial">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tienda</th>
                      <th>Nº líneas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialProveedor.length === 0 && (
                      <tr><td colSpan={4} style={{textAlign:'center', padding:'10px'}}>No hay pedidos en este periodo.</td></tr>
                    )}
                    {historialProveedor.map((h) => (
                      <tr key={h.id}>
                        <td>{h.fechaEnvio ? new Date(h.fechaEnvio).toLocaleString() : (h.fecha ? new Date(h.fecha).toLocaleString() : '-')}</td>
                        <td>{h.tienda?.nombre || h.tienda || '-'}</td>
                        <td style={{textAlign:'center'}}>{h.numeroLineas}</td>
                        <td className="historial-actions">
                          <button onClick={()=>setEnvioExpandido(h.id)} className="btn-info btn-small">Detalles</button>
                          <button onClick={() => {if(h.pedido && h.pedido.lineas && h.tienda) exportarProveedorPDF(h.pedido.lineas, {nombre: h.tienda?.nombre || h.tienda});}} className="btn-secondary btn-small">PDF</button>
                          <button onClick={() => {if(h.pedido && Array.isArray(h.pedido.lineas)) {setLineasProveedor(h.pedido.lineas.map(l => ({...l, cantidad: ''}))); setMostrarModalProveedor(true);}}} className="btn-success btn-small">Reutilizar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {envioExpandido && (
                <div className="detalle-expandido-historial">
                  <button onClick={()=>setEnvioExpandido(null)} className="btn-default btn-small" style={{float:'right'}}>Cerrar Detalle</button>
                  <h4>Detalle del pedido</h4>
                  {(() => {
                    const h = historialProveedor.find(x=>x.id===envioExpandido);
                    if(!h) return null;
                    return (
                      <div>
                        <p><strong>Fecha:</strong> {h.fecha ? new Date(h.fecha).toLocaleString() : '-'}</p>
                        <p><strong>Tienda:</strong> {h.tienda?.nombre || h.tienda || '-'}</p>
                        <p><strong>Nº líneas:</strong> {h.numeroLineas}</p>
                        <p><strong>Proveedor:</strong> {h.proveedor}</p>
                        <p><strong>Líneas del pedido:</strong></p>
                        <ul>
                          {h.pedido?.lineas?.map((l,i)=>( <li key={i}>{l.referencia || '-'} - {l.cantidad} {l.unidad || 'kg'}</li> ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}