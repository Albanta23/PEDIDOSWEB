// Hook para obtener lotes disponibles de un producto en el almacén central
import { useState, useEffect } from 'react';
import { getMovimientosStock } from '../services/movimientosStockService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Devuelve los lotes disponibles para un producto en el almacén central, filtrando por fecha y stock > 0
 * @param {string} producto - Nombre o ID del producto
 * @param {string} fechaExpedicion - Fecha de expedición/pedido (ISO)
 * @returns {Array} lotes disponibles [{ lote, cantidad, peso, fechaEntrada }]
 */
export function useLotesDisponiblesProducto(producto, fechaExpedicion) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoProducto, setInfoProducto] = useState(null);

  // Primero obtenemos la información del producto para saber si se controla por unidades o por peso
  useEffect(() => {
    if (!producto) return;
    
    setLoading(true);
    axios.get(`${API_URL}/productos?nombre=${encodeURIComponent(producto)}`)
      .then(response => {
        if (response.data && response.data.length > 0) {
          setInfoProducto(response.data[0]);
        }
      })
      .catch(err => console.error('Error al obtener información del producto:', err));
  }, [producto]);

  useEffect(() => {
    if (!producto) return;
    setLoading(true);
    getMovimientosStock({ tiendaId: 'almacen_central', producto })
      .then(movs => {
        // Filtrar solo entradas válidas y anteriores a la fecha de expedición
        const lotesMap = {};
        movs.forEach(mov => {
          if (mov.tipo === 'entrada' && mov.lote && new Date(mov.fecha) <= new Date(fechaExpedicion)) {
            if (!lotesMap[mov.lote]) {
              lotesMap[mov.lote] = { lote: mov.lote, cantidad: 0, peso: 0, fechaEntrada: mov.fecha };
            }
            lotesMap[mov.lote].cantidad += Number(mov.cantidad) || 0;
            lotesMap[mov.lote].peso += Number(mov.peso) || 0;
          }
        });
        
        // Determinar si se controla por unidades o por peso
        const esSoloPorUnidades = infoProducto && infoProducto.unidad && infoProducto.unidad !== 'kg';
        
        // Solo lotes con stock > 0
        // Si el producto se controla por unidades, mostrar lotes con cantidad > 0 aunque el peso sea 0
        setLotes(Object.values(lotesMap).filter(l => {
          if (esSoloPorUnidades) {
            return l.cantidad > 0; // Si es por unidades, solo importa que haya unidades disponibles
          }
          return l.cantidad > 0 || l.peso > 0; // Mantener la lógica original para productos por peso
        }));
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [producto, fechaExpedicion, infoProducto]);

  return { lotes, loading, error };
}

/**
 * Ejemplo de integración en el editor de pedidos:
 *
 * const { lotes, loading } = useLotesDisponiblesProducto(productoSeleccionado, fechaExpedicion);
 * <select>
 *   <option value="">-- Escribir lote manualmente --</option>
 *   {lotes.map(l => <option key={l.lote} value={l.lote}>{l.lote} (Stock: {l.cantidad} / {l.peso}kg)</option>)}
 * </select>
 * <input type="text" value={loteManual} ... />
 *
 * Así el usuario puede elegir un lote disponible o escribir uno manualmente si no hay stock previo.
 */
