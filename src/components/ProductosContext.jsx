import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ProductosContext = createContext();

// Cambiar la URL para que funcione correctamente en cualquier entorno
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
const API_URL_CORRECTO = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;
console.log('[DEBUG ProductosContext] API_URL:', API_URL);
console.log('[DEBUG ProductosContext] VITE_API_URL:', import.meta.env.VITE_API_URL);

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL_CORRECTO}/productos`);
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
