import React, { useState, useEffect, useRef } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from '../components/ProductosContext';
import { useLotesDisponibles } from '../hooks/useLotesDisponibles';
import { actualizarPedidoCliente, registrarDevolucionParcial, registrarDevolucionTotal } from './pedidosClientesExpedicionService';
import * as ticketGenerator from '../utils/ticketGenerator';
import './ExpedicionClienteEditor.css';
import '../styles/lote-selector.css'; // Importar estilos para el selector de lotes
import ModalDevolucion from './ModalDevolucion';
import ModalBultos from './ModalBultos';

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

function LineaPedido({ linea, idx, productos, actualizarLinea, borrarLinea }) {
  const producto = productos.find(p => p.nombre === linea.producto);
  const { lotes, loading, error } = useLotesDisponibles(producto?._id);

  return (
    linea.esComentario ? (
      <div key={`comment-${idx}`} className="linea-comentario-card">
        <h4>📝 COMENTARIO:</h4>
        <textarea
          value={linea.comentario || ''}
          onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
          placeholder="Escribe aquí tu comentario..."
        />
        <div className="linea-actions">
          <button className="btn-danger" onClick={() => borrarLinea(idx)} title="Eliminar comentario">🗑 Eliminar</button>
        </div>
      </div>
    ) : (
      <div key={idx} className="linea-pedido-card">
        <div className="form-group">
          <label>Producto</label>
          <input
            value={linea.producto}
            onChange={e => actualizarLinea(idx, 'producto', e.target.value)}
            placeholder="Producto"
          />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Cantidad</label>
            <input
              type="number"
              min="1"
              value={linea.cantidad}
              onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Formato</label>
            <select value={linea.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)}>
              {FORMATOS_PEDIDO.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Peso (kg)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={linea.peso || ''}
              onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
              placeholder="Peso (kg)"
            />
          </div>
          <div className="form-group">
            <label>Lote</label>
            <LoteSelector
              productoId={producto?._id}
              value={linea.lote === null || linea.lote === undefined ? '' : linea.lote}
              onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
              lotes={lotes}
              loading={loading}
              error={error}
            />
          </div>
        </div>
        <div className="form-group">
          <label>Comentario de línea</label>
          <input
            type="text"
            value={linea.comentario === null || linea.comentario === undefined ? '' : linea.comentario}
            onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
          />
        </div>
        <div className="linea-actions">
          <button className="btn-danger" onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑 Eliminar</button>
        </div>
      </div>
    )
  );
}

export default function ExpedicionClienteEditor({ pedido, usuario, onClose, onActualizado }) {
  const { productos } = useProductos();
  const [lineas, setLineas] = useState([]);
  const [estado, setEstado] = useState(pedido.estado || 'pendiente');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editado, setEditado] = useState(false);
  const [bultos, setBultos] = useState(pedido.bultos || lineas.filter(l => !l.esComentario).length || 0);
  const [showModalDevolucion, setShowModalDevolucion] = useState(false);
  const [showModalBultos, setShowModalBultos] = useState(false);
  const lineasRef = useRef();

  useEffect(() => {
    if (pedido && Array.isArray(pedido.lineas)) {
      setLineas(pedido.lineas.map(l => ({ ...l })));
      setEditado(false);
      setEstado(pedido.estado || 'pendiente');
      setBultos(pedido.bultos || pedido.lineas.filter(l => !l.esComentario).length || 0);
    } else {
      setLineas([]);
      setEditado(false);
      setEstado('pendiente');
      setBultos(0);
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
    console.log('Guardando bultos:', bultos);
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await actualizarPedidoCliente(pedido._id || pedido.id, { lineas, estado: 'en_preparacion', usuarioTramitando: usuario || 'expediciones', bultos });
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

  // Cerrar pedido: imprime ticket automáticamente y abre modal bultos
  function handleCerrar() {
    // 1. Imprimir automáticamente ticket profesional en Epson (impresora predeterminada)
    try {
      const ticketTexto = ticketGenerator.generarTicketTexto(pedidoParaImprimir, usuario || 'Expediciones');
      
      // Crear iframe oculto para imprimir sin mostrar ventana
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(ticketTexto);
      iframeDoc.close();
      
      // Imprimir automáticamente en impresora predeterminada
      setTimeout(() => {
        iframe.contentWindow.print();
        // Remover iframe después de imprimir
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
      
      console.log('✅ Ticket profesional enviado a Epson (impresora predeterminada)');
      
    } catch (error) {
      console.error('Error al imprimir ticket profesional:', error);
    }
    
    // 2. Abrir modal de bultos para etiquetas Zebra
    setShowModalBultos(true);
  }

  // Imprimir etiquetas Zebra: UNA SOLA VENTANA con todas las etiquetas
  const handleImprimirEtiquetas = (numBultos) => {
    try {
      // Generar documento único con todas las etiquetas
      const documentoCompleto = ticketGenerator.generarDocumentoEtiquetasCompleto(pedidoParaImprimir, numBultos);
      
      // Abrir una sola ventana con todas las etiquetas
      const ventana = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (ventana) {
        ventana.document.write(documentoCompleto);
        ventana.document.close();
        
        // Activar impresión automática
        setTimeout(() => {
          try {
            ventana.focus();
            ventana.print();
          } catch (error) {
            console.warn('Error al imprimir etiquetas:', error);
          }
        }, 500);
        
        console.log(`✅ ${numBultos} etiquetas de envío generadas en una sola ventana para Zebra`);
      }
      
    } catch (error) {
      console.error('Error al generar etiquetas de envío:', error);
      alert('Error al generar las etiquetas de envío');
    }
    
    // Cerrar modal
    setShowModalBultos(false);
  };

  const esPreparado = estado === 'preparado' || estado === 'entregado';
  const esDevuelto = pedido.enHistorialDevoluciones || estado === 'devuelto_parcial' || estado === 'devuelto_total';

  const handleDevolucionParcial = async (devolucion) => {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await registrarDevolucionParcial(pedido._id || pedido.id, devolucion);
      setMensaje('Devolución parcial registrada correctamente');
      if (onActualizado) onActualizado();
      setTimeout(() => {
        setMensaje('');
        setShowModalDevolucion(false);
        if (onClose) onClose(); // Cerrar editor tras devolución
      }, 1200);
    } catch {
      setError('Error al registrar la devolución parcial');
    } finally {
      setGuardando(false);
    }
  };

  const handleDevolucionTotal = async () => {
    const motivo = prompt('Introduce el motivo de la devolución total:');
    if (!motivo) return;

    const aptoParaVenta = window.confirm('¿Los productos son aptos para la venta?');

    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await registrarDevolucionTotal(pedido._id || pedido.id, motivo, aptoParaVenta);
      setMensaje('Devolución total registrada correctamente');
      if (onActualizado) onActualizado();
      setTimeout(() => {
        setMensaje('');
        if (onClose) onClose(); // Cerrar editor tras devolución
      }, 1200);
    } catch {
      setError('Error al registrar la devolución total');
    } finally {
      setGuardando(false);
    }
  };

  if (esDevuelto) {
    return (
      <div className="expedicion-cliente-editor-container">
        <div className="editor-header">
          <h3>Pedido Nº {pedido.numeroPedido || pedido.id} (DEVUELTO)</h3>
        </div>
        <div className="info-pedido">
          <div><b>Cliente:</b> {pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || '-'}</div>
          <div><b>Dirección:</b> {pedido.direccion || pedido.direccionEnvio || '-'}</div>
        </div>
        <div className="estado-pedido" style={{ color: '#d32f2f', fontWeight: 700 }}>
          Este pedido ha sido devuelto y solo es visible en el historial de devoluciones.
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="expedicion-cliente-editor-container">
        <div className="editor-header">
          <h3>Editar Pedido Nº {pedido.numeroPedido || pedido.id}</h3>
          <div className="editor-actions-main" style={{ marginRight: '80px' }}>
            {!esPreparado && <button className="btn-success" onClick={editado ? handleGuardar : undefined} disabled={guardando || !editado}>Guardar</button>}
            {!esPreparado && <button className="btn-premium" onClick={handleCerrar} disabled={guardando || estado === 'preparado'}>Cerrar pedido</button>}
          </div>
        </div>

      <div className="info-pedido">
        <div><b>Cliente:</b> {pedido.clienteNombre || pedido.nombreCliente || pedido.cliente || '-'}</div>
        <div><b>Dirección:</b> {pedido.direccion || pedido.direccionEnvio || '-'}</div>
        {pedido.origen?.tipo === 'woocommerce' && (
          <div><b>Total Pedido:</b> {pedido.total?.toFixed(2)}€</div>
        )}
      </div>

      <div className="estado-pedido" style={{ color: estado === 'en_espera' ? '#d32f2f' : estado === 'en_preparacion' ? '#388e3c' : '#1976d2' }}>
        Estado actual: {estado === 'en_espera' ? 'EN ESPERA' : estado === 'en_preparacion' ? 'EN PREPARACIÓN' : estado === 'preparado' ? 'PREPARADO' : estado}
      </div>

      <div className="bultos-usuario-info">
        Bultos:
        <input
          type="number"
          min={0}
          value={bultos}
          onChange={e => { setBultos(Number(e.target.value)); setEditado(true); }}
        />
        · Editado por: {usuario || 'expediciones'}
      </div>

      <div className="editor-body">
        {lineas.length === 0 && (
          <div className="no-lineas-mensaje">Sin líneas</div>
        )}
        {lineas.map((l, idx) => (
          <LineaPedido
            key={idx}
            linea={l}
            idx={idx}
            productos={productos}
            actualizarLinea={actualizarLinea}
            borrarLinea={borrarLinea}
          />
        ))}
        {pedido.notasCliente && (
          <div className="linea-comentario-card">
            <h4>📝 NOTAS DEL CLIENTE:</h4>
            <p>{pedido.notasCliente}</p>
          </div>
        )}
      </div>

      <div className="editor-footer-actions">
        <button className="btn-secondary" onClick={addLinea}>+ Añadir Producto</button>
        <button className="btn-info" onClick={addComentario}>+ Añadir Comentario</button>
      </div>

      {mensaje && <div className="editor-feedback feedback-success">{mensaje}</div>}
      {error && <div className="editor-feedback feedback-error">{error}</div>}
    </div>
      {showModalDevolucion && <ModalDevolucion pedido={pedido} onClose={() => setShowModalDevolucion(false)} onDevolucion={handleDevolucionParcial} />}
      {showModalBultos && (
        <ModalBultos
          bultosInicial={bultos}
          onCancel={() => setShowModalBultos(false)}
          onImprimir={handleImprimirEtiquetas}
        />
      )}
    </>
  );
}
