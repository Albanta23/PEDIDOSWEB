// Contexto global para proveedores
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getProveedores, crearProveedor, actualizarProveedor, eliminarProveedor } from '../services/proveedoresService';

const ProveedoresContext = createContext();

export function useProveedores() {
  return useContext(ProveedoresContext);
}

export function ProveedoresProvider({ children }) {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar proveedores al iniciar
  useEffect(() => {
    async function fetchProveedores() {
      setLoading(true);
      try {
        const data = await getProveedores();
        setProveedores(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar proveedores');
      } finally {
        setLoading(false);
      }
    }
    fetchProveedores();
  }, []);

  // Métodos CRUD
  const addProveedor = async (proveedorData) => {
    const nuevo = await crearProveedor(proveedorData);
    setProveedores(prev => [...prev, nuevo]);
    return nuevo;
  };
  const updateProveedor = async (id, proveedorData) => {
    const actualizado = await actualizarProveedor(id, proveedorData);
    setProveedores(prev => prev.map(p => p._id === id ? actualizado : p));
    return actualizado;
  };
  const deleteProveedor = async (id) => {
    await eliminarProveedor(id);
    setProveedores(prev => prev.filter(p => p._id !== id));
  };

  return (
    <ProveedoresContext.Provider value={{ proveedores, loading, error, addProveedor, updateProveedor, deleteProveedor }}>
      {children}
    </ProveedoresContext.Provider>
  );
}
