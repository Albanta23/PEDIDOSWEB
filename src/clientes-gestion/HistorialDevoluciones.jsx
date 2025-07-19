import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_URL_CORRECTO = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

export default function HistorialDevoluciones() {
  const [pedidosDevueltos, setPedidosDevueltos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL_CORRECTO}/pedidos-clientes?enHistorialDevoluciones=true`)
      .then(res => {
        setPedidosDevueltos(res.data || []);
      })
      .catch(() => setPedidosDevueltos([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div style={{
      marginTop: 32,
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      minHeight: '100vh',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '24px 32px',
        borderRadius: '16px',
        marginBottom: '32px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          fontSize: '48px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '50%',
          width: '80px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>🔄</div>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '700' }}>
            Historial de Devoluciones
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
            Listado de todos los pedidos con devoluciones
          </p>
        </div>
      </div>

      {cargando ? <p>Cargando...</p> : (
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Nº Pedido</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Cliente</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Fecha Devolución</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Tipo Devolución</th>
                <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '2px solid #e2e8f0' }}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {pedidosDevueltos.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '48px', fontSize: '16px', fontStyle: 'italic' }}>
                    No hay devoluciones en el historial.
                  </td>
                </tr>
              )}
              {pedidosDevueltos.map(p => (
                (p.devoluciones || []).map((d, i) => (
                  <tr key={`${p._id}-${i}`} style={{
                    background: i % 2 === 0 ? '#fff' : '#f8fafc',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#1e293b' }}>#{p.numeroPedido}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{p.clienteNombre}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>{new Date(d.fecha).toLocaleString('es-ES')}</td>
                    <td style={{ padding: '16px', color: '#475569' }}>
                      <span style={{
                        background: d.tipo === 'total' ? '#ff6b6b20' : '#ffc10720',
                        color: d.tipo === 'total' ? '#ff6b6b' : '#ffc107',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}>
                        {d.tipo}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#475569' }}>{d.motivo}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
