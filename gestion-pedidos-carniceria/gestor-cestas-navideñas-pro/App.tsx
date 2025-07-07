import React from 'react';
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
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './src/contexts/ThemeContext';

const App: React.FC = () => {
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
              </Routes>
            </LayoutPremium>
          </HashRouter>
        </ToastProvider>
      </DataProvider>
    </ThemeProvider>
  );
};

export default App;
