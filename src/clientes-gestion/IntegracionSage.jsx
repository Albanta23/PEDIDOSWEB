import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

export default function IntegracionSage() {
  const [pedidos, setPedidos] = useState([]);
  const [selectedPedidos, setSelectedPedidos] = useState([]);
  const [exportedPedidos, setExportedPedidos] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Cargar solo pedidos que no sean borradores
    axios.get(`${API_URL}/pedidos-clientes?enviado=false`)
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
  
  const handleExportSage50 = async () => {
    if (selectedPedidos.length === 0) {
      toast.warn('No has seleccionado ningún pedido para exportar.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/pedidos-clientes/exportar-sage50`,
        { pedidoIds: selectedPedidos },
        { responseType: 'blob' } // Importante para manejar la descarga del archivo
      );
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Exportacion_Sage50.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exportados ${selectedPedidos.length} pedidos correctamente.`);
      markAsExported();
    } catch (error) {
      console.error('Error al exportar para Sage 50:', error);
      toast.error('Error al generar el archivo de exportación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Integración SAGE 50</h2>
      <p>Selecciona los pedidos que quieres exportar y elige el formato de descarga.</p>

      <div>
        <button onClick={handleExportSage50} disabled={selectedPedidos.length === 0 || isLoading}>
          {isLoading ? 'Generando...' : `Exportar ${selectedPedidos.length} pedidos a Excel (SAGE 50)`}
        </button>
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
