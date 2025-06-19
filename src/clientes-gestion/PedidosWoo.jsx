import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PedidosWoo() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    axios.get('/api/pedidos-woo')
      .then(res => setPedidos(res.data))
      .catch(()=>setPedidos([]))
      .finally(()=>setCargando(false));
  }, []);

  return (
    <div>
      <h2>Pedidos WooCommerce</h2>
      {cargando ? <p>Cargando...</p> : (
        <table style={{width:'100%',background:'#fff',borderRadius:8,boxShadow:'0 2px 8px #1976d211'}}>
          <thead>
            <tr style={{background:'#e3eafc'}}>
              <th>ID</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Líneas</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(p=>(
              <tr key={p._id||p.id}>
                <td>{p._id||p.id}</td>
                <td>{p.cliente||'-'}</td>
                <td>{p.fechaPedido ? new Date(p.fechaPedido).toLocaleString() : '-'}</td>
                <td>{p.estado||'-'}</td>
                <td>{p.lineas?.length||0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
