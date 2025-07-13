// Hook para obtener lotes disponibles de un producto en el almacén central
import { useState, useEffect } from 'react';
import { getMovimientosStock } from '../services/movimientosStockService';

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
        // Solo lotes con stock > 0
        setLotes(Object.values(lotesMap).filter(l => l.cantidad > 0 || l.peso > 0));
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [producto, fechaExpedicion]);

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
