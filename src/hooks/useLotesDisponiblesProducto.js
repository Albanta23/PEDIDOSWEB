// Hook para obtener lotes disponibles de un producto en el almacén central
import { useState, useEffect, useRef } from 'react';
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
  const debounceRef = useRef(null);

  // CORRECIÓN: Debounce para evitar múltiples consultas por carácter tecleado
  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Solo buscar si el producto tiene al menos 3 caracteres para evitar consultas inútiles
    if (!producto || producto.trim().length < 3) {
      setInfoProducto(null);
      return;
    }
    
    // Debounce de 500ms para evitar saturación de requests
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      axios.get(`${API_URL}/productos?nombre=${encodeURIComponent(producto)}`)
        .then(response => {
          if (response.data && response.data.length > 0) {
            setInfoProducto(response.data[0]);
          } else {
            setInfoProducto(null);
          }
        })
        .catch(err => {
          // Solo loggear errores para productos con nombre válido
          if (producto.trim().length >= 3) {
            console.error('Error al obtener información del producto:', err);
          }
          setInfoProducto(null);
        });
    }, 500);

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [producto]);

  useEffect(() => {
    // Solo buscar lotes si el producto tiene al menos 3 caracteres
    if (!producto || producto.trim().length < 3) {
      setLotes([]);
      setLoading(false);
      return;
    }

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
        // Solo loggear errores para productos con nombre válido
        if (producto.trim().length >= 3) {
          console.error(`Error al obtener movimientos de stock para producto "${producto}":`, err);
        }
        setError(err);
        setLotes([]);
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
