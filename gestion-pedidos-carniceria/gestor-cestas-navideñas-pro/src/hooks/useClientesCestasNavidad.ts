import { useEffect, useState } from 'react';

export interface CustomerCestaNavidad {
  id: string;
  name: string;
  nif?: string;
  email?: string;
  phone?: string;
  poblacion?: string;
  provincia?: string;
  address?: string;
  [key: string]: any;
}

export function useClientesCestasNavidad(activos = true) {
  const [clientes, setClientes] = useState<CustomerCestaNavidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clientes/cestas-navidad?activos=${activos ? 'true' : 'false'}`)
      .then(res => res.json())
      .then(data => {
        setClientes(Array.isArray(data.clientes) ? data.clientes : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [activos]);

  return { clientes, loading, error };
}
