import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ProductosContext = createContext();

// Construcción robusta de la URL base para productos
let apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
const PRODUCTOS_API_ENDPOINT = `${apiUrl}/productos`;


export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(PRODUCTOS_API_ENDPOINT);
      setProductos(res.data);
    } catch (e) {
      setProductos([]);
    }
    setCargando(false);
  };

  // Nueva función para buscar productos por nombre o referencia (búsqueda parcial)
  const buscarProductos = async (q) => {
    if (!q || typeof q !== 'string' || !q.trim()) return [];
    try {
      const res = await axios.get(`${PRODUCTOS_API_ENDPOINT}/buscar`, { params: { q } });
      return res.data;
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const value = {
    productos,
    cargando,
    buscarProductos,
  };

  return (
    <ProductosContext.Provider value={value}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos() {
  return useContext(ProductosContext);
}
