import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ProductosProvider } from '../components/ProductosContext';

createRoot(document.getElementById('root')).render(
  <ProductosProvider>
    <App />
  </ProductosProvider>
);
