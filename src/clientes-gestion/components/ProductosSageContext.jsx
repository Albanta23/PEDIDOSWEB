import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

const ProductosSageContext = createContext();

let apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';
if (!apiUrl.endsWith('/api')) apiUrl = apiUrl + '/api';
const PRODUCTOS_SAGE_API_ENDPOINT = `${apiUrl}/productos-sage`;

export function ProductosSageProvider({ children }) {
  const [productosSage, setProductosSage] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarProductosSage = async () => {
    setCargando(true);
    try {
      const res = await axios.get(PRODUCTOS_SAGE_API_ENDPOINT);
      setProductosSage(res.data);
    } catch (e) {
      setProductosSage([]);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarProductosSage();
  }, []);

  return (
    <ProductosSageContext.Provider value={{ productosSage, cargando }}>
      {children}
    </ProductosSageContext.Provider>
  );
}

export function useProductosSage() {
  return useContext(ProductosSageContext);
}
