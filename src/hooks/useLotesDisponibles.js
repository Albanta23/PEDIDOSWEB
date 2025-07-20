import { useState, useEffect } from 'react';
import { getLotesDisponibles } from '../services/lotesService';

export function useLotesDisponibles(productoId) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productoId) {
      setLotes([]);
      return;
    }

    async function fetchLotes() {
      setLoading(true);
      setError('');
      try {
        const data = await getLotesDisponibles(productoId);
        setLotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchLotes();
  }, [productoId]);

  return { lotes, loading, error };
}
