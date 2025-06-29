import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PedidoClienteDetalle from './PedidoClienteDetalle';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

function getMonday(d) {
  d = new Date(d);
  var day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDateInput(date) {
  return date.toISOString().slice(0, 10);
}

export default function HistorialPedidosClientes({ soloPreparados }) {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState(formatDateInput(getMonday(new Date())));
  const [fechaFin, setFechaFin] = useState(formatDateInput(new Date()));
  const [pedidosAbiertos, setPedidosAbiertos] = useState([]);
  const [pedidosCerrados, setPedidosCerrados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);

  const cancelarPedido = async (pedido) => {
    if (!window.confirm('¿Seguro que quieres cancelar este pedido?')) return;
    setCancelandoId(pedido._id);
    try {
      await axios.put(`${API_URL}/api/pedidos-clientes/${pedido._id}`, {
        ...pedido,
        estado: 'cancelado',
        usuarioTramitando: 'usuario',
      });
      // Opcional: lógica para reponer stock aquí si es necesario
      setCancelandoId(null);
      // Refrescar pedidos
      let params = [];
      if (clienteId) params.push(`clienteId=${clienteId}`);
      if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
      if (fechaFin) params.push(`fechaFin=${fechaFin}`);
      const query = params.length ? '?' + params.join('&') : '';
      const res = await axios.get(`${API_URL}/api/pedidos-clientes${query}`);
      const pedidos = res.data || [];
      setPedidosAbiertos(pedidos.filter(p => p.estado !== 'preparado' && p.estado !== 'cancelado'));
      setPedidosCerrados(pedidos.filter(p => p.estado === 'preparado'));
    } catch (e) {
      setCancelandoId(null);
      alert('Error al cancelar el pedido');
    }
  };

  useEffect(() => {
    axios.get(`${API_URL}/api/clientes`).then(res => setClientes(res.data)).catch(()=>setClientes([]));
  }, []);

  useEffect(() => {
    setCargando(true);
    let params = [];
    if (clienteId) params.push(`clienteId=${clienteId}`);
    if (fechaInicio) params.push(`fechaInicio=${fechaInicio}`);
    if (fechaFin) params.push(`fechaFin=${fechaFin}`);
    const query = params.length ? '?' + params.join('&') : '';
    axios.get(`${API_URL}/api/pedidos-clientes${query}`)
      .then(res => {
        const pedidos = res.data || [];
        if (soloPreparados) {
          setPedidosAbiertos([]);
          setPedidosCerrados(pedidos.filter(p => p.estado === 'preparado'));
        } else {
          setPedidosAbiertos(pedidos.filter(p => p.estado !== 'preparado' && p.estado !== 'cancelado'));
          setPedidosCerrados(pedidos.filter(p => p.estado === 'preparado'));
        }
        setCargando(false);
      })
      .catch(() => setCargando(false));
  }, [clienteId, fechaInicio, fechaFin, soloPreparados]);

  const colorEstado = estado => {
    if (estado === 'en_espera') return '#d32f2f';
    if (estado === 'en_preparacion') return '#388e3c';
    if (estado === 'preparado') return '#1976d2';
    if (estado === 'cancelado') return '#888';
    return '#1976d2';
  };

  return (
    <div style={{ marginTop: 32 }}>
      <h3>Historial de Pedidos de Clientes</h3>
      <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:24}}>
        <label>Cliente:
          <select value={clienteId} onChange={e=>setClienteId(e.target.value)} style={{marginLeft:8,padding:6,borderRadius:6}}>
            <option value="">Todos</option>
            {clientes.map(c=>(<option key={c._id||c.id||c.codigo} value={c._id||c.id||c.codigo}>{c.nombre}</option>))}
          </select>
        </label>
        <label>Fecha inicio:
          <input type="date" value={fechaInicio} onChange={e=>setFechaInicio(e.target.value)} style={{marginLeft:8,padding:6,borderRadius:6}} />
        </label>
        <label>Fecha fin:
          <input type="date" value={fechaFin} onChange={e=>setFechaFin(e.target.value)} style={{marginLeft:8,padding:6,borderRadius:6}} />
        </label>
      </div>
      {cargando ? <div>Cargando...</div> : (
        <>
          <h4>Pedidos abiertos</h4>
          <table style={{ width: '100%', marginBottom: 24 }}>
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosAbiertos.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Sin pedidos abiertos</td></tr>}
              {pedidosAbiertos.map(p => (
                <tr key={p._id || p.id}>
                  <td>{p.numeroPedido || p.id}</td>
                  <td>{p.clienteNombre || '-'}</td>
                  <td style={{ color: colorEstado(p.estado), fontWeight: 700 }}>{p.estado?.replace('_', ' ').toUpperCase()}</td>
                  <td>{p.fechaPedido ? new Date(p.fechaPedido).toLocaleString() : '-'}</td>
                  <td>
                    <button onClick={()=>setPedidoDetalle(p)} style={{padding:'4px 12px',background:'#1976d2',color:'#fff',border:'none',borderRadius:6,fontWeight:600,marginRight:8}}>Ver detalle</button>
                    <button onClick={()=>cancelarPedido(p)} disabled={cancelandoId===p._id} style={{padding:'4px 12px',background:'#dc3545',color:'#fff',border:'none',borderRadius:6,fontWeight:600}}>
                      {cancelandoId===p._id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4>Pedidos cerrados</h4>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nº Pedido</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosCerrados.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>Sin pedidos cerrados</td></tr>}
              {pedidosCerrados.map(p => (
                <tr key={p._id || p.id}>
                  <td>{p.numeroPedido || p.id}</td>
                  <td>{p.clienteNombre || '-'}</td>
                  <td style={{ color: colorEstado(p.estado), fontWeight: 700 }}>{p.estado?.replace('_', ' ').toUpperCase()}</td>
                  <td>{p.fechaPedido ? new Date(p.fechaPedido).toLocaleString() : '-'}</td>
                  <td>
                    <button onClick={()=>setPedidoDetalle(p)} style={{padding:'4px 12px',background:'#1976d2',color:'#fff',border:'none',borderRadius:6,fontWeight:600}}>Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pedidoDetalle && <PedidoClienteDetalle pedido={pedidoDetalle} onClose={()=>setPedidoDetalle(null)} />}
        </>
      )}
    </div>
  );
}
