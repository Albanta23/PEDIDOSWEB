import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ProductosContext = createContext();

// Cambiar la URL para que funcione correctamente en cualquier entorno
const API_URL = '/api';

export function ProductosProvider({ children }) {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarProductos = async () => {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL}/productos`);
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
