import * as React from 'react';
import { Product } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import ProductForm from '../products/ProductForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, TrashIcon, FunnelIcon } from '../icons/HeroIcons';
import ProductCSVImport from '../products/ProductCSVImport';

const ProductManagementPage: React.FC = () => {
  const { products, suppliers } = useData(); // addProduct, updateProduct, deleteProduct removed, handled by form
  const { addToast } = useToast();
  const confirmAction = useConfirm();
  const dataContext = useData(); // Get full context
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredProducts = React.useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.family?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (suppliers.find(s => s.id === product.supplierId)?.name.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm, suppliers]);

  const openModalForNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    // productData not used, form updates context
    setIsModalOpen(false);
    setEditingProduct(null);
    // Toast is handled within ProductForm
  };

  const handleDeleteProduct = (productId: string) => {
    confirmAction('¿Está seguro de que desea eliminar este producto?', () => {
      try {
        // Call context deleteProduct directly.
        dataContext.deleteProduct(productId);
        addToast('Producto eliminado correctamente.', 'success');
      } catch (error) {
        addToast('Error al eliminar el producto.', 'error');
        console.error(error);
      }
    });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Productos</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nuevo Producto
            </Button>
            <ProductCSVImport onImport={(file: File) => {
              // Aquí puedes implementar la lógica de actualización por CSV
              // Por ejemplo, parsear el CSV y actualizar productos
              alert('Funcionalidad de importación CSV aún no implementada. Archivo: ' + file.name);
            }} />
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <ProductForm product={editingProduct} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Familia</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Precio Costo</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Stock</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Unidad</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Proveedor</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredProducts.map((product) => {
              const supplier = suppliers.find(s => s.id === product.supplierId);
              return (
                <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-900">{product.name}</div>
                    <div className="text-xs text-neutral-500 truncate max-w-xs">{product.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{product.family || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{product.costPrice.toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{product.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{supplier?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(product)} aria-label="Editar">
                      <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} aria-label="Eliminar">
                      <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
                    </Button>
                  </td>
                </tr>
              );
            })}
             {filteredProducts.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-500">
                        {products.length === 0 ? "No hay productos registrados. Comience añadiendo uno." : "No se encontraron productos que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductManagementPage;
