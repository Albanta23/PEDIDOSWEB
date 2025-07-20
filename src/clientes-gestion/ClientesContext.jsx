import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const ClientesContext = createContext();

// Construcción robusta de la URL base para clientes
let apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
const CLIENTES_API_ENDPOINT = `${apiUrl}/clientes`;

export function ClientesProvider({ children }) {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarClientes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await axios.get(CLIENTES_API_ENDPOINT);
      setClientes(res.data);
    } catch (e) {
      setClientes([]);
      setError('Error al cargar clientes');
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const value = {
    clientes,
    cargando,
    error,
    recargar: cargarClientes,
    setClientes, // Exponer para casos avanzados
  };

  return (
    <ClientesContext.Provider value={value}>
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  return useContext(ClientesContext);
}