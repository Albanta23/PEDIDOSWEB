import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import LayoutPremium from './src/components/Layout-Premium';
import DashboardPagePremium from './src/components/pages/DashboardPage-Premium';
import ProductManagementPagePremium from './src/components/pages/ProductManagementPage-Premium';
import ClientManagementPagePremium from './src/components/pages/ClientManagementPage-Premium';
import HamperManagementPage from './components/pages/HamperManagementPage';
import InventoryPage from './components/pages/InventoryPage';
import QuoteManagementPage from './components/pages/QuoteManagementPage';
import OrderPage from './components/pages/OrderPage';
import InvoicingPage from './components/pages/InvoicingPage';
import SupplierPage from './components/pages/SupplierPage';
import TaxInfoPage from './components/pages/TaxInfoPage';
import BatchOrderPage from './components/pages/BatchOrderPage';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const USUARIOS_CESTAS = [
  { nombre: 'Elier', pin: '1973' },
  { nombre: 'Amaya', pin: 'Amaya' },
];

const App: React.FC = () => {
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [autenticado, setAutenticado] = useState(false);

  if (!autenticado) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f4f7fb'}}>
        <form onSubmit={e => {
          e.preventDefault();
          if (!usuario || !pin) {
            setErrorLogin('Debes introducir usuario y PIN');
            return;
          }
          const user = USUARIOS_CESTAS.find(u => u.nombre === usuario && u.pin === pin);
          if (user) {
            localStorage.setItem('usuarioCRM', usuario);
            localStorage.setItem('pinCRM', pin);
            setErrorLogin('');
            setAutenticado(true);
          } else {
            setErrorLogin('Usuario o PIN incorrecto');
          }
        }} style={{background:'#fff',padding:32,borderRadius:16,boxShadow:'0 2px 16px #1976d222',minWidth:320}}>
          <h2 style={{marginBottom:18}}>Acceso Gestor Cestas Navideñas</h2>
          <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="Usuario" style={{fontSize:22,padding:12,borderRadius:8,border:'1.5px solid #1976d2',marginBottom:12,width:180,textAlign:'center'}} autoFocus />
          <input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="PIN" style={{fontSize:22,padding:12,borderRadius:8,border:'1.5px solid #1976d2',marginBottom:12,width:180,textAlign:'center'}} />
          {errorLogin && <div style={{color:'#d32f2f',marginBottom:10}}>{errorLogin}</div>}
          <button type="submit" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:8,fontWeight:700,fontSize:18,padding:'10px 32px',cursor:'pointer'}}>Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="cestas-theme">
      <DataProvider>
        <ToastProvider>
          <HashRouter>
            <LayoutPremium>
              <Routes>
                <Route path="/" element={<DashboardPagePremium />} />
                <Route path="/products" element={<ProductManagementPagePremium />} />
                <Route path="/clientes-cestas" element={<ClientManagementPagePremium />} />
                <Route path="/hampers" element={<HamperManagementPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/quotes" element={<QuoteManagementPage />} />
                <Route path="/orders" element={<OrderPage />} />
                <Route path="/invoices" element={<InvoicingPage />} />
                <Route path="/suppliers" element={<SupplierPage />} />
                <Route path="/tax-info" element={<TaxInfoPage />} />
                <Route path="/batch-orders" element={<BatchOrderPage />} />
              </Routes>
            </LayoutPremium>
          </HashRouter>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
