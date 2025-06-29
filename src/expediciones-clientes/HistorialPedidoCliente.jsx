import React, { useEffect, useState } from 'react';
import { obtenerHistorialPedidoCliente } from './pedidosClientesExpedicionService';

export default function HistorialPedidoCliente({ pedidoId, visible, onClose }) {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && pedidoId) {
      setCargando(true);
      setError('');
      obtenerHistorialPedidoCliente(pedidoId)
        .then(data => setHistorial(data))
        .catch(() => setError('Error al cargar historial'))
        .finally(() => setCargando(false));
    }
  }, [visible, pedidoId]);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0007', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 2px 16px #0003', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#888', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
        <h3 style={{ marginBottom: 18 }}>Historial del pedido</h3>
        {cargando ? <div>Cargando historial...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
          <ul style={{ maxHeight: 350, overflowY: 'auto', padding: 0, listStyle: 'none' }}>
            {historial.length === 0 && <li style={{ color: '#888' }}>Sin historial disponible.</li>}
            {historial.map((h, idx) => (
              <li key={idx} style={{ marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                <div><b>Fecha:</b> {h.fecha || h.createdAt || '-'}</div>
                <div><b>Acción:</b> {h.accion || h.estado || '-'}</div>
                <div><b>Usuario:</b> {h.usuario || '-'}</div>
                {h.comentario && <div><b>Comentario:</b> {h.comentario}</div>}
                {h.lineas && <div><b>Nº de bultos:</b> {h.lineas.filter(l=>!l.esComentario).length}</div>}
                {h.bultos !== undefined && <div><b>Bultos registrados:</b> {h.bultos}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
