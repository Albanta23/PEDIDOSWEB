import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function IntegracionSage() {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedidos, setSelectedPedidos] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes`)
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos([]));
  }, []);

  const handleSelectPedido = (pedidoId) => {
    setSelectedPedidos(prev =>
      prev.includes(pedidoId)
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const getSelectedPedidosData = () => {
    return pedidos.filter(p => selectedPedidos.includes(p._id));
  };

  const exportToExcel = () => {
    const data = getSelectedPedidosData().map(p => ({
      NumeroPedido: p.numeroPedido,
      Cliente: p.clienteNombre,
      Fecha: new Date(p.fechaPedido).toLocaleDateString(),
      Estado: p.estado,
      Lineas: p.lineas.map(l => `${l.producto} (x${l.cantidad})`).join(', ')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, 'pedidos_sage.xlsx');
  };

  const exportToCSV = () => {
    const data = [];
    getSelectedPedidosData().forEach(p => {
      p.lineas.forEach(l => {
        if (!l.esComentario) {
          data.push({
            TIPO: 'ALB',
            CODIGO: p.numeroPedido,
            FECHA: new Date(p.fechaPedido).toLocaleDateString('es-ES'),
            CLIENTE: p.clienteId,
            DESCRIPCION: l.producto,
            CANTIDAD: l.cantidad,
            PRECIO: l.precio || 0, // Asumiendo que las líneas tienen un precio
            TOTAL: (l.cantidad * (l.precio || 0)).toFixed(2)
          });
        }
      });
    });
    const csv = Papa.unparse(data, { delimiter: ';' });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'albaranes_sage.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToXML = () => {
    const pedidosSeleccionados = getSelectedPedidosData();
    const xmlString = `<?xml version="1.0" encoding="UTF-8"?>
<SageImport>
  ${pedidosSeleccionados.map(pedido => `
  <DeliveryNote>
    <Header>
      <Number>${pedido.numeroPedido}</Number>
      <Date>${new Date(pedido.fechaPedido).toLocaleDateString('es-ES')}</Date>
      <Customer>${pedido.clienteId}</Customer>
    </Header>
    <Lines>
      ${pedido.lineas.filter(l => !l.esComentario).map(linea => `
      <Line>
        <Item>${linea.producto}</Item>
        <Description>${linea.producto}</Description>
        <Quantity>${linea.cantidad}</Quantity>
        <Price>${linea.precio || 0}</Price>
      </Line>
      `).join('')}
    </Lines>
  </DeliveryNote>
  `).join('')}
</SageImport>`;

    const blob = new Blob([xmlString], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'albaranes_sage.xml');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    const data = getSelectedPedidosData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'pedidos_sage.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h2>Integración SAGE 50</h2>
      <p>Selecciona los pedidos que quieres exportar y elige el formato de descarga.</p>

      <div>
        <button onClick={exportToExcel} disabled={selectedPedidos.length === 0}>Exportar a Excel</button>
        <button onClick={exportToCSV} disabled={selectedPedidos.length === 0}>Exportar a CSV</button>
        <button onClick={exportToXML} disabled={selectedPedidos.length === 0}>Exportar a XML</button>
        <button onClick={exportToJSON} disabled={selectedPedidos.length === 0}>Exportar a JSON</button>
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Seleccionar</th>
              <th>Nº Pedido</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map(pedido => (
              <tr key={pedido._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedPedidos.includes(pedido._id)}
                    onChange={() => handleSelectPedido(pedido._id)}
                  />
                </td>
                <td>{pedido.numeroPedido}</td>
                <td>{pedido.clienteNombre}</td>
                <td>{new Date(pedido.fechaPedido).toLocaleDateString()}</td>
                <td>{pedido.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
