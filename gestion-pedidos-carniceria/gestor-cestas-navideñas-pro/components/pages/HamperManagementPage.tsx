import React, { useState, useMemo } from 'react';
import { Hamper } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import HamperForm from '../hampers/HamperForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, TrashIcon, EyeIcon, FunnelIcon, ArchiveBoxIcon } from '../icons/HeroIcons'; // CurrencyEuroIcon eliminado

const HamperManagementPage: React.FC = () => {
  const { hampers, products, calculateHamperDetails } = useData(); // deleteHamper removed
  const { addToast } = useToast();
  const confirmAction = useConfirm();
  const dataContext = useData(); // get full context
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHamper, setEditingHamper] = useState<Hamper | null>(null);
  const [viewingHamper, setViewingHamper] = useState<Hamper | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const openModalForNew = () => {
    setEditingHamper(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (hamper: Hamper) => {
    setEditingHamper(hamper);
    setIsModalOpen(true);
  };
  
  const openViewModal = (hamper: Hamper) => {
    const details = calculateHamperDetails(hamper.components, hamper.sellingPrice);
    setViewingHamper({...hamper, ...details});
    setIsViewModalOpen(true);
  };

  const handleSaveSuccess = () => { 
    setIsModalOpen(false);
    setEditingHamper(null);
  };

  const handleDeleteHamper = (hamperId: string) => {
    confirmAction('¿Está seguro de que desea eliminar esta cesta?',() => {
      try {
        dataContext.deleteHamper(hamperId);
        addToast('Cesta eliminada correctamente.', 'success');
      } catch (error) {
        addToast('Error al eliminar la cesta.', 'error');
        console.error(error);
      }
    });
  };

  const enrichedHampers = useMemo(() => {
    return hampers.map(hamper => {
      const details = calculateHamperDetails(hamper.components, hamper.sellingPrice);
      return {
        ...hamper,
        ...details
      };
    }).filter(hamper => 
        hamper.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hamper.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hampers, calculateHamperDetails, searchTerm]);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Cestas</h1>
         <div className="flex items-center gap-x-2 w-full md:w-auto">
            <Input
              type="text"
              placeholder="Buscar cestas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nueva Cesta
            </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingHamper ? 'Editar Cesta' : 'Nueva Cesta'} size="2xl">
        <HamperForm hamper={editingHamper} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalles de: ${viewingHamper?.name}`} size="lg">
        {viewingHamper && (
          <div className="space-y-4">
            <p><strong className="text-neutral-700">Descripción:</strong> {viewingHamper.description || "N/A"}</p>
            <p><strong className="text-neutral-700">Precio de Venta:</strong> {viewingHamper.sellingPrice.toFixed(2)}€</p>
            <div>
              <h4 className="font-semibold text-neutral-800 mb-2">Componentes:</h4>
              {viewingHamper.components.length > 0 ? (
                <ul className="list-disc list-inside pl-2 space-y-1 bg-neutral-50 p-3 rounded-md border border-neutral-200">
                  {viewingHamper.components.map((comp, index) => {
                    const product = products.find(p => p.id === comp.productId);
                    return <li key={index} className="text-sm text-neutral-700">{product?.name || 'Producto Desconocido'} (x{comp.quantity})</li>;
                  })}
                </ul>
              ) : <p className="text-sm text-neutral-500">Esta cesta no tiene componentes definidos.</p>}
            </div>
             <div className="bg-neutral-100 p-4 rounded-md space-y-1 border border-neutral-200 mt-3">
                <h4 className="text-md font-semibold text-neutral-800 mb-2">Información Calculada:</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-neutral-600">Costo Componentes:</span><span className="font-medium text-neutral-800 text-right">{viewingHamper.calculatedTotalCostPrice?.toFixed(2) || '0.00'}€</span>
                    <span className="text-neutral-600">Peso Estimado:</span><span className="font-medium text-neutral-800 text-right">{(viewingHamper.calculatedTotalWeightGrams ? viewingHamper.calculatedTotalWeightGrams / 1000 : 0).toFixed(2)} kg</span>
                    {viewingHamper.calculatedTotalVolumeMilliliters !== undefined && viewingHamper.calculatedTotalVolumeMilliliters > 0 && 
                        <> <span className="text-neutral-600">Volumen Estimado:</span><span className="font-medium text-neutral-800 text-right">{(viewingHamper.calculatedTotalVolumeMilliliters / 1000).toFixed(2)} L</span></>
                    }
                    <span className="text-neutral-600">IVA Soportado (costo):</span><span className="font-medium text-neutral-800 text-right">{viewingHamper.calculatedTotalInputVat?.toFixed(2) || '0.00'}€</span>
                    <span className="text-neutral-600">Margen Bruto:</span><span className={`font-medium text-right ${viewingHamper.calculatedProfit !== undefined && viewingHamper.calculatedProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{viewingHamper.calculatedProfit?.toFixed(2) || '0.00'}€</span>
                    <span className="text-neutral-600">Margen (% sobre costo):</span><span className={`font-medium text-right ${viewingHamper.calculatedProfitPercentage !== undefined && viewingHamper.calculatedProfitPercentage >= 0 ? 'text-green-700' : 'text-red-700'}`}>{isFinite(viewingHamper.calculatedProfitPercentage || 0) ? (viewingHamper.calculatedProfitPercentage || 0).toFixed(2) + '%' : 'N/A'}</span>
                 </div>
            </div>
          </div>
        )}
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrichedHampers.map((hamper) => (
          <div key={hamper.id} className="bg-white shadow-lg rounded-lg p-5 flex flex-col justify-between hover:shadow-xl transition-shadow">
            <div>
              <h2 className="text-xl font-semibold text-primary-dark mb-1 truncate">{hamper.name}</h2>
              <p className="text-sm text-neutral-600 mb-2 h-10 overflow-hidden text-ellipsis">{hamper.description || "Sin descripción."}</p>
              <p className="text-2xl font-bold text-secondary-dark mb-3">{hamper.sellingPrice.toFixed(2)}€</p>
              
              <div className="text-xs text-neutral-500 mb-3 space-y-0.5">
                <div className="flex justify-between"><span>Costo Comp.:</span> <span>{hamper.calculatedTotalCostPrice?.toFixed(2) || 'N/A'}€</span></div>
                <div className="flex justify-between"><span>Peso Est.:</span> <span>{(hamper.calculatedTotalWeightGrams ? hamper.calculatedTotalWeightGrams / 1000 : 0).toFixed(2)} kg</span></div>
                <div className="flex justify-between items-center">
                    <span>Margen:</span> 
                    <span className={`font-semibold ${hamper.calculatedProfit !== undefined && hamper.calculatedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {hamper.calculatedProfit?.toFixed(2) || 'N/A'}€ ({isFinite(hamper.calculatedProfitPercentage || 0) ? (hamper.calculatedProfitPercentage || 0).toFixed(1) + '%' : 'N/A'})
                    </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-1 mt-auto pt-3 border-t border-neutral-100">
              <Button variant="ghost" size="sm" onClick={() => openViewModal(hamper)} aria-label="Ver Detalles">
                <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openModalForEdit(hamper)} aria-label="Editar Cesta">
                <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteHamper(hamper.id)} aria-label="Eliminar Cesta">
                <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800" />
              </Button>
            </div>
          </div>
        ))}
         {enrichedHampers.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-10">
                <ArchiveBoxIcon className="h-16 w-16 text-neutral-300 mx-auto mb-4"/>
                <p className="text-xl font-semibold text-neutral-700 mb-2">
                    {hampers.length === 0 ? "Aún no hay cestas definidas" : "No se encontraron cestas"}
                </p>
                <p className="text-neutral-500">
                     {hampers.length === 0 ? "Comience creando su primera cesta navideña." : "Intente ajustar los términos de búsqueda o cree una nueva cesta."}
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default HamperManagementPage;
