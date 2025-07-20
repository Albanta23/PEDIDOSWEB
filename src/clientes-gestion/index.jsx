
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { ProductosProvider } from '../components/ProductosContext';
import { BrowserRouter } from 'react-router-dom';
import { ClientesProvider } from './ClientesContext';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ProductosProvider>
      <ClientesProvider>
        <App />
      </ClientesProvider>
    </ProductosProvider>
  </BrowserRouter>
);
