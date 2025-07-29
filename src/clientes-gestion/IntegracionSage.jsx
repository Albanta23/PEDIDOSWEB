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
  
  const handleExportSage50 = async (formato = 'excel') => {
    if (selectedPedidos.length === 0) {
      toast.warn('No has seleccionado ningún pedido para exportar.');
      return;
    }
    setIsLoading(true);
    try {
      const endpoint = formato === 'csv' 
        ? `${API_URL}/pedidos-clientes/exportar-sage50-csv`
        : `${API_URL}/pedidos-clientes/exportar-sage50`;
        
      const response = await axios.post(
        endpoint,
        { pedidoIds: selectedPedidos },
        { responseType: 'blob' }
      );
      
      // Crear un enlace para descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fecha = new Date().toISOString().split('T')[0];
      const extension = formato === 'csv' ? 'csv' : 'xlsx';
      const nombreArchivo = `Exportacion_SAGE50_${fecha}.${extension}`;
      
      link.setAttribute('download', nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exportados ${selectedPedidos.length} pedidos correctamente en formato ${formato.toUpperCase()}.`);
      markAsExported();
    } catch (error) {
      console.error('Error al exportar para Sage 50:', error);
      toast.error('Error al generar el archivo de exportación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>🔗 Integración SAGE 50</h2>
      <div style={{ 
        background: '#f0f8ff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #e0e8f0' 
      }}>
        <p><strong>📋 Instrucciones:</strong></p>
        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
          <li>Selecciona los pedidos que quieres exportar a SAGE50</li>
          <li>Elige el formato: <strong>Excel</strong> (recomendado) o <strong>CSV</strong></li>
          <li>El archivo generado contiene albaranes de venta listos para importar</li>
          <li>Estructura compatible con el formato estándar de SAGE50</li>
        </ul>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px',
        padding: '15px',
        background: '#fff',
        borderRadius: '8px',
        border: '1px solid #ddd',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleExportSage50('excel')} 
            disabled={selectedPedidos.length === 0 || isLoading}
            style={{
              background: selectedPedidos.length > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '6px',
              cursor: selectedPedidos.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              minWidth: '180px'
            }}
          >
            {isLoading ? '📊 Generando...' : `📊 Exportar Excel (${selectedPedidos.length})`}
          </button>
          
          <button 
            onClick={() => handleExportSage50('csv')} 
            disabled={selectedPedidos.length === 0 || isLoading}
            style={{
              background: selectedPedidos.length > 0 ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '6px',
              cursor: selectedPedidos.length > 0 ? 'pointer' : 'not-allowed',
              fontWeight: 'bold',
              minWidth: '180px'
            }}
          >
            {isLoading ? '📄 Generando...' : `📄 Exportar CSV (${selectedPedidos.length})`}
          </button>
        </div>
        
        {selectedPedidos.length > 0 && (
          <div style={{ 
            padding: '8px 12px', 
            background: '#e8f5e8', 
            borderRadius: '4px',
            fontSize: '14px',
            color: '#155724'
          }}>
            ✅ {selectedPedidos.length} pedido(s) seleccionado(s)
          </div>
        )}
      </div>

      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Seleccionar</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Nº Pedido</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Cliente</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Fecha</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Estado</th>
              <th style={{ 
                padding: '12px', 
                textAlign: 'left', 
                borderBottom: '2px solid #ddd',
                fontWeight: 'bold'
              }}>Líneas</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido, index) => (
              <tr 
                key={pedido._id}
                style={{ 
                  background: index % 2 === 0 ? '#fff' : '#f9f9f9',
                  borderBottom: '1px solid #eee'
                }}
              >
                <td style={{ padding: '12px' }}>
                  {exportedPedidos.has(pedido._id) ? (
                    <button 
                      onClick={() => resetExported(pedido._id)}
                      style={{
                        background: '#ffc107',
                        color: '#333',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✅ Exportado
                    </button>
                  ) : (
                    <input
                      type="checkbox"
                      checked={selectedPedidos.includes(pedido._id)}
                      onChange={() => handleSelectPedido(pedido._id)}
                      style={{ 
                        transform: 'scale(1.2)',
                        cursor: 'pointer'
                      }}
                    />
                  )}
                </td>
                <td style={{ 
                  padding: '12px',
                  fontWeight: 'bold',
                  color: '#007bff'
                }}>
                  {pedido.numeroPedido}
                </td>
                <td style={{ padding: '12px' }}>
                  {pedido.clienteNombre}
                </td>
                <td style={{ padding: '12px' }}>
                  {new Date(pedido.fechaPedido).toLocaleDateString('es-ES')}
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    background: pedido.estado === 'enviado' ? '#d4edda' : 
                               pedido.estado === 'preparado' ? '#fff3cd' : '#f8d7da',
                    color: pedido.estado === 'enviado' ? '#155724' : 
                           pedido.estado === 'preparado' ? '#856404' : '#721c24'
                  }}>
                    {pedido.estado}
                  </span>
                </td>
                <td style={{ padding: '12px', color: '#6c757d' }}>
                  {(pedido.lineas || []).filter(l => !l.esComentario).length} productos
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {pedidos.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            color: '#6c757d',
            background: 'white',
            borderRadius: '8px'
          }}>
            📭 No hay pedidos disponibles para exportar
          </div>
        )}
      </div>
    </div>
  );
}
