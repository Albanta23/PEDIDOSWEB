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

  useEffect(() => {
    cargarProductos();
  }, []);

  const value = {
    productos,
    cargando,
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
