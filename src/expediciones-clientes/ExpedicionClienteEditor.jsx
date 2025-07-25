import React, { useState, useEffect, useRef } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { useProductos } from '../components/ProductosContext';
import { useLotesDisponibles } from '../hooks/useLotesDisponibles';
import { actualizarPedidoCliente, registrarDevolucionParcial, registrarDevolucionTotal } from './pedidosClientesExpedicionService';
import { generarTicket } from '../utils/ticketGenerator';
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

  // Abrir modal de bultos
  function handleCerrar() {
    setShowModalBultos(true);
  }

  // Imprimir etiquetas y cerrar pedido
  async function handleImprimirEtiquetas(numBultos) {
    setShowModalBultos(false);
    setError('');
    setMensaje('');
    setGuardando(true);

    // 1. Abrir las ventanas de impresión ANTES de cualquier 'await'
    // Esto es crucial para evitar que los bloqueadores de pop-ups las bloqueen.
    const printWindows = [];
    for (let i = 0; i < numBultos; i++) {
      const printWindow = window.open('', '_blank', 'width=450,height=700');
      if (printWindow) {
        // Escribir un mensaje de espera mientras se procesa el pedido
        printWindow.document.write('<html><head><title>Generando etiqueta...</title></head><body><h1>Generando etiqueta, por favor espere...</h1></body></html>');
        printWindows.push(printWindow);
      } else {
        // Si la ventana no se pudo abrir, informar al usuario y detener el proceso.
        setError('No se pudo abrir la ventana de impresión. Por favor, deshabilita el bloqueador de pop-ups para este sitio.');
        setGuardando(false);
        return;
      }
    }

    try {
      const datosPedido = {
        ...pedido,
        lineas,
        estado: 'preparado',
        usuarioTramitando: usuario || 'expediciones',
        bultos: numBultos,
      };

      // 2. Realizar la operación asíncrona (actualizar el pedido)
      const pedidoActualizado = await actualizarPedidoCliente(pedido._id || pedido.id, datosPedido);

      // 3. Ahora, con los datos actualizados, llenar las ventanas que ya están abiertas
      printWindows.forEach((printWindow, i) => {
        if (!printWindow || printWindow.closed) {
          console.warn(`La ventana de impresión ${i + 1} fue cerrada por el usuario.`);
          return; // Saltar si el usuario cerró la ventana
        }

        const etiqueta = generarTicket(pedidoActualizado, i + 1, numBultos);
        
        // Usar directamente el HTML generado por el generador de tickets
        printWindow.document.open();
        printWindow.document.write(etiqueta.html);
        printWindow.document.close();
        
        // Pequeña pausa entre etiquetas para asegurar que se impriman correctamente
        setTimeout(() => {
          if (printWindow && !printWindow.closed) {
            printWindow.print();
            setTimeout(() => printWindow.close(), 500);
          }
        }, i * 200);
      });

      setMensaje('Pedido cerrado y etiquetas impresas');
      setEstado('preparado');
      setEditado(false);
      setBultos(numBultos);
      if (onActualizado) onActualizado();
      setTimeout(() => {
        setMensaje('');
        onClose();
      }, 1500);

    } catch (e) {
      setError('Error al cerrar el pedido: ' + (e.response?.data?.error || e.message));
      // En caso de error, cerrar las ventanas que se hayan abierto
      printWindows.forEach(pw => pw && !pw.closed && pw.close());
    } finally {
      setGuardando(false);
    }
  }

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
          <div className="editor-actions-main">
            <button className="btn-default" onClick={onClose}>Cerrar ventana</button>
          </div>
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
          <div className="editor-actions-main">
            {!esPreparado && <button className="btn-success" onClick={editado ? handleGuardar : undefined} disabled={guardando || !editado}>Guardar</button>}
            {!esPreparado && <button className="btn-premium" onClick={handleCerrar} disabled={guardando || estado === 'preparado'}>Cerrar pedido</button>}
            <button className="btn-default" onClick={onClose}>Cerrar ventana</button>
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
