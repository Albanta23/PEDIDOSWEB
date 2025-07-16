import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function HistorialDevoluciones() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes?estado=devuelto_parcial,devuelto_total`)
      .then(res => {
        const devoluciones = res.data.flatMap(p => p.devoluciones.map(d => ({ ...d, numeroPedido: p.numeroPedido })));
        setDevoluciones(devoluciones);
      })
      .catch(() => setDevoluciones([]))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div>
      <h2>Historial de Devoluciones</h2>
      {cargando ? <p>Cargando...</p> : (
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Nº Pedido</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {devoluciones.map((d, i) => (
              <tr key={i}>
                <td>{d.numeroPedido}</td>
                <td>{d.tipo}</td>
                <td>{new Date(d.fecha).toLocaleDateString()}</td>
                <td>{d.motivo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
