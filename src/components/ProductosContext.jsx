import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ProductosContext = createContext();

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL}/api/productos`);
      setProductos(res.data);
    } catch (e) {
      setProductos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  return (
    <ProductosContext.Provider value={{ productos, cargarProductos, cargando }}>
      {children}
    </ProductosContext.Provider>
  );
}

export function useProductos() {
  return useContext(ProductosContext);
}
