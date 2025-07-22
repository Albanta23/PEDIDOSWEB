import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function IntegracionSage() {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [exportedPedidos, setExportedPedidos] = useState(new Set());

  useEffect(() => {
    axios.get(`${API_URL}/pedidos-clientes`)
      .then(res => setPedidos(res.data))
      .catch(() => setPedidos([]));
  }, []);

  const handleSelectPedido = (pedidoId) => {
    if (exportedPedidos.has(pedidoId)) return;
    setSelectedPedidos(prev =>
      prev.includes(pedidoId)
        ? prev.filter(id => id !== pedidoId)
        : [...prev, pedidoId]
    );
  };

  const markAsExported = () => {
    setExportedPedidos(prev => new Set([...prev, ...selectedPedidos]));
    setSelectedPedidos([]);
  };

  const resetExported = (pedidoId) => {
    setExportedPedidos(prev => {
      const newSet = new Set(prev);
      newSet.delete(pedidoId);
      return newSet;
    });
  };

  const getSelectedPedidosData = () => {
    return pedidos.filter(p => selectedPedidos.includes(p._id));
  };

  const exportToExcel = () => {
    // Creamos la hoja principal de pedidos con información detallada
    const pedidosData = getSelectedPedidosData().map(p => ({
      NumeroPedido: p.numeroPedido,
      Cliente_ID: p.clienteId,
      Cliente_Nombre: p.clienteNombre,
      Fecha: new Date(p.fechaPedido).toLocaleDateString('es-ES'),
      FechaCreacion: new Date(p.fechaCreacion || p.fechaPedido).toLocaleDateString('es-ES'),
      Estado: p.estado,
      Subtotal: p.subtotal || 0,
      IVA_Total: p.totalIva || 0,
      Total: p.total || 0,
      FormaPago: p.formaPago || '',
      Observaciones: p.observaciones || '',
      DireccionEntrega: p.direccionEntrega || '',
      EmailCliente: p.emailCliente || '',
      TelefonoCliente: p.telefonoCliente || '',
      EnvioNacional: p.envioNacional ? 'Sí' : 'No',
      TipoCliente: p.tipoCliente || '',
      NumLineas: p.lineas ? p.lineas.length : 0,
      FechaEntrega: p.fechaEntrega ? new Date(p.fechaEntrega).toLocaleDateString('es-ES') : '',
      FechaUltimaModificacion: p.fechaUltimaModificacion ? new Date(p.fechaUltimaModificacion).toLocaleDateString('es-ES') : '',
      UsuarioCreacion: p.usuarioCreacion || '',
      Origen: p.origen || 'Manual'
    }));
    
    // Creamos una hoja para las líneas de pedido detalladas
    const lineasData = [];
    getSelectedPedidosData().forEach(p => {
      p.lineas && p.lineas.forEach((l, index) => {
        lineasData.push({
          NumeroPedido: p.numeroPedido,
          Cliente: p.clienteNombre,
          LineaNum: index + 1,
          Producto: l.producto || '',
          Cantidad: l.cantidad || 0,
          Precio: l.precio || 0,
          Subtotal: (l.cantidad * l.precio) || 0,
          IVA_Porcentaje: l.iva || 0,
          IVA_Importe: ((l.cantidad * l.precio) * (l.iva / 100)) || 0,
          Total: ((l.cantidad * l.precio) * (1 + (l.iva / 100))) || 0,
          Lote: l.lote || '',
          FechaCaducidad: l.fechaCaducidad ? new Date(l.fechaCaducidad).toLocaleDateString('es-ES') : '',
          UnidadMedida: l.unidadMedida || '',
          Descuento: l.descuento || 0,
          Comentario: l.esComentario ? 'Sí' : 'No',
          CodigoProducto: l.codigoProducto || '',
          Familia: l.familia || '',
          SKU: l.sku || '',
          Peso: l.peso || 0,
          TipoIVA: l.tipoIVA || ''
        });
      });
    });

    // Creamos un libro de Excel con múltiples hojas
    const wb = XLSX.utils.book_new();
    
    // Añadimos la hoja de pedidos
    const wsPedidos = XLSX.utils.json_to_sheet(pedidosData);
    XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');
    
    // Añadimos la hoja de líneas de pedido
    const wsLineas = XLSX.utils.json_to_sheet(lineasData);
    XLSX.utils.book_append_sheet(wb, wsLineas, 'Lineas');
    
    // Guardamos el archivo
    XLSX.writeFile(wb, 'pedidos_sage50.xlsx');
    markAsExported();
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
            PRECIO: l.precio || 0,
            TOTAL: (l.cantidad * (l.precio || 0)).toFixed(2),
            IVA: l.iva || 0
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
    markAsExported();
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
        <TaxRate>${linea.iva || 0}</TaxRate>
      </Line>
      `).join('')}
    </Lines>
    <Summary>
      <Subtotal>${pedido.subtotal || 0}</Subtotal>
      <TaxAmount>${pedido.totalIva || 0}</TaxAmount>
      <Total>${pedido.total || 0}</Total>
    </Summary>
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
    markAsExported();
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
    markAsExported();
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
                  {exportedPedidos.has(pedido._id) ? (
                    <button onClick={() => resetExported(pedido._id)}>Habilitar</button>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedPedidos.includes(pedido._id)}
                      onChange={() => handleSelectPedido(pedido._id)}
                    />
                  )}
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
