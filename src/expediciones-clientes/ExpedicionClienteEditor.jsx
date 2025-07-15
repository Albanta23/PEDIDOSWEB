import React, { useState, useEffect, useRef } from 'react';
import { FORMATOS_PEDIDO } from '../configFormatos';
import { actualizarPedidoCliente, registrarDevolucionParcial, registrarDevolucionTotal } from './pedidosClientesExpedicionService';
import './ExpedicionClienteEditor.css';
import ModalDevolucion from './ModalDevolucion';

export default function ExpedicionClienteEditor({ pedido, usuario, onClose, onActualizado }) {
  const [lineas, setLineas] = useState([]);
  const [estado, setEstado] = useState(pedido.estado || 'pendiente');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editado, setEditado] = useState(false);
  const [bultos, setBultos] = useState(pedido.bultos || lineas.filter(l => !l.esComentario).length || 0);
  const [showModalDevolucion, setShowModalDevolucion] = useState(false);
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

  // Cerrar pedido (pasa a PREPARADO)
  async function handleCerrar() {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await actualizarPedidoCliente(pedido._id || pedido.id, { lineas, estado: 'preparado', usuarioTramitando: usuario || 'expediciones', bultos });
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

  const esPreparado = estado === 'preparado' || estado === 'entregado';

  const handleDevolucionParcial = async (devolucion) => {
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      await registrarDevolucionParcial(pedido._id || pedido.id, devolucion);
      setMensaje('Devolución parcial registrada correctamente');
      if (onActualizado) onActualizado();
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setError('Error al registrar la devolución parcial');
    } finally {
      setGuardando(false);
      setShowModalDevolucion(false);
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
        onClose();
      }, 1200);
    } catch {
      setError('Error al registrar la devolución total');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="expedicion-cliente-editor-container">
        <div className="editor-header">
          <h3>Editar Pedido Nº {pedido.numeroPedido || pedido.id}</h3>
          <div className="editor-actions-main">
            {!esPreparado && <button className="btn-success" onClick={editado ? handleGuardar : undefined} disabled={guardando || !editado}>Guardar</button>}
            {!esPreparado && <button className="btn-premium" onClick={handleCerrar} disabled={guardando || estado === 'preparado'}>Cerrar pedido</button>}
            {esPreparado && <button className="btn-warning" onClick={() => setShowModalDevolucion(true)}>Devolución Parcial</button>}
            {esPreparado && <button className="btn-danger" onClick={handleDevolucionTotal}>Devolución Total</button>}
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
        {lineas.map((l, idx) => l.esComentario ? (
          <div key={`comment-${idx}`} className="linea-comentario-card">
            <h4>📝 COMENTARIO:</h4>
            <textarea
              value={l.comentario || ''}
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
                value={l.producto}
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
                  value={l.cantidad}
                  onChange={e => actualizarLinea(idx, 'cantidad', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Formato</label>
                <select value={l.formato || ''} onChange={e => actualizarLinea(idx, 'formato', e.target.value)}>
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
                  value={l.peso || ''}
                  onChange={e => actualizarLinea(idx, 'peso', e.target.value)}
                  placeholder="Peso (kg)"
                />
              </div>
              <div className="form-group">
                <label>Lote</label>
                <input
                  type="text"
                  value={l.lote === null || l.lote === undefined ? '' : l.lote}
                  onChange={e => actualizarLinea(idx, 'lote', e.target.value)}
                  placeholder="Lote"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Comentario de línea</label>
              <input
                type="text"
                value={l.comentario === null || l.comentario === undefined ? '' : l.comentario}
                onChange={e => actualizarLinea(idx, 'comentario', e.target.value)}
              />
            </div>
            <div className="linea-actions">
              <button className="btn-danger" onClick={() => borrarLinea(idx)} title="Eliminar línea">🗑 Eliminar</button>
            </div>
          </div>
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
    </>
  );
}
