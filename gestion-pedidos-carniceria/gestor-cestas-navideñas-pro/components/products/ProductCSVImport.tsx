import React from 'react';
import Button from '../shared/Button';
import Papa from 'papaparse';
import { useData } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';

interface ProductCSVImportProps {
  onImport?: (file: File) => void;
}

const ProductCSVImport: React.FC<ProductCSVImportProps> = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { products, addProduct, updateProduct } = useData();
  const { addToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          let updated = 0;
          let created = 0;
          (results.data as any[]).forEach(row => {
            const id = String(row.NumArticulo);
            const existing = products.find(p => p.id === id);
            const productData = {
              id,
              name: row.Descripcion,
              description: row.Comentario || '',
              costPrice: parseFloat(row.PCompra) || 0,
              stock: 0,
              unit: 'pieza',
              weightGrams: 0,
              volumeMilliliters: undefined,
              vatRate: row.IVA === 'R' ? 0.10 : row.IVA === 'SR' ? 0.21 : 0.21,
              supplierId: undefined,
              family: row.Familia || undefined,
            };
            if (existing) {
              updateProduct(productData);
              updated++;
            } else {
              addProduct(productData);
              created++;
            }
          });
          addToast(`Productos actualizados: ${updated}, creados: ${created}`, 'success');
        },
        error: () => addToast('Error al procesar el archivo CSV', 'error'),
      });
      e.target.value = '';
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        Actualizar productos por CSV
      </Button>
    </div>
  );
};

export default ProductCSVImport;
