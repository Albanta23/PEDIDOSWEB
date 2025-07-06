import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './components/pages/DashboardPage';
import ProductManagementPage from './components/pages/ProductManagementPage';
import HamperManagementPage from './components/pages/HamperManagementPage';
import InventoryPage from './components/pages/InventoryPage';
import QuoteManagementPage from './components/pages/QuoteManagementPage'; // New
import OrderPage from './components/pages/OrderPage';
import InvoicingPage from './components/pages/InvoicingPage';
import CustomerPage from './components/pages/CustomerPage';
import SupplierPage from './components/pages/SupplierPage';
import TaxInfoPage from './components/pages/TaxInfoPage';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext'; // New

const App: React.FC = () => {
  return (
    <DataProvider>
      <ToastProvider> {/* Wrap with ToastProvider */}
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductManagementPage />} />
              <Route path="/hampers" element={<HamperManagementPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/quotes" element={<QuoteManagementPage />} /> {/* New Route */}
              <Route path="/orders" element={<OrderPage />} />
              <Route path="/invoices" element={<InvoicingPage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/suppliers" element={<SupplierPage />} />
              <Route path="/tax-info" element={<TaxInfoPage />} />
            </Routes>
          </Layout>
        </HashRouter>
      </ToastProvider>
    </DataProvider>
  );
};

export default App;
