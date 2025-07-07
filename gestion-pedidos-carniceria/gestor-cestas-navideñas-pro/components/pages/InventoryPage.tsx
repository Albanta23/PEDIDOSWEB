

import React, { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { Product } from '../../types';
import Input from '../shared/forms/Input';
import Button from '../shared/Button';
import { PencilIcon, TrashIcon } from '../icons/HeroIcons';

const InventoryPage: React.FC = () => {
  const { products, suppliers, updateProduct, clearAllProducts, forceResetInventory, openConfirmModal } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStock, setEditingStock] = useState<{ productId: string; currentStock: number } | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditStock = (product: Product) => {
    setEditingStock({ productId: product.id, currentStock: product.stock });
    setNewStockValue(product.stock.toString());
  };

  const handleSaveStock = () => {
    if (editingStock) {
      const product = products.find(p => p.id === editingStock.productId);
      const stockVal = parseInt(newStockValue, 10);
      if (product && !isNaN(stockVal) && stockVal >= 0) {
        updateProduct({ ...product, stock: stockVal });
        setEditingStock(null);
        setNewStockValue('');
      } else {
        alert("Valor de stock inválido.");
      }
    }
  };

  const handleClearAllProducts = () => {
    openConfirmModal(
      `¿Está seguro de que desea eliminar TODOS los productos del inventario? Esta acción no se puede deshacer. Se eliminarán ${products.length} productos.`,
      () => {
        try {
          clearAllProducts();
          alert('Todos los productos han sido eliminados del inventario.');
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Error al eliminar productos');
        }
      },
      'Eliminar Todo el Inventario',
      'danger'
    );
  };

  const handleForceResetInventory = () => {
    openConfirmModal(
      `¿Está seguro de que desea REINICIAR COMPLETAMENTE el inventario? Esto eliminará TODOS los productos y cestas. Esta acción no se puede deshacer.`,
      () => {
        try {
          forceResetInventory();
          alert('El inventario ha sido completamente reiniciado.');
        } catch (error) {
          alert(error instanceof Error ? error.message : 'Error al reiniciar inventario');
        }
      },
      'Reiniciar Inventario Completo',
      'danger'
    );
  };


  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-3xl font-semibold text-neutral-900">Control de Inventario</h1>
        
        {/* Danger Zone */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 mb-3">Zona de Peligro</h3>
          <div className="space-y-2">
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearAllProducts}
              disabled={products.length === 0}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Eliminar Todos los Productos ({products.length})
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleForceResetInventory}
              disabled={products.length === 0}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Reiniciar Inventario Completo
            </Button>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Buscar producto por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          containerClassName="max-w-md"
        />
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Proveedor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock Actual</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Unidad</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Valor de Costo Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredProducts.map((product) => {
              const supplier = suppliers.find(s => s.id === product.supplierId);
              const isEditingThis = editingStock?.productId === product.id;
              return (
                <tr key={product.id} className={`hover:bg-neutral-50 transition-colors ${product.stock < 10 ? (product.stock < 5 ? 'bg-red-50' : 'bg-yellow-50') : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{supplier?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 text-center">
                    {isEditingThis ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Input 
                            type="number" 
                            value={newStockValue} 
                            onChange={(e) => setNewStockValue(e.target.value)} 
                            className="w-20 text-center py-1"
                            containerClassName="m-0"
                        />
                      </div>
                    ) : (
                      <span className={`font-semibold ${product.stock < 10 ? (product.stock < 5 ? 'text-red-600' : 'text-yellow-700') : 'text-green-600'}`}>
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{product.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 text-center">{(product.stock * product.costPrice).toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {isEditingThis ? (
                         <div className="flex items-center justify-center space-x-2">
                            <Button size="sm" onClick={handleSaveStock}>Guardar</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingStock(null)}>Cancelar</Button>
                         </div>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleEditStock(product)} aria-label="Ajustar Stock" title="Ajustar Stock">
                            <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800"/>
                        </Button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredProducts.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                       {products.length === 0 ? "No hay productos registrados." : "No se encontraron productos con ese nombre."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
