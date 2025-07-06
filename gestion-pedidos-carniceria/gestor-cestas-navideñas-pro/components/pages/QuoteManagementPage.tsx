import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Quote, QuoteStatus, OrderStatus, Order, PaymentStatus } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import QuoteForm from '../quotes/QuoteForm';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import { PlusCircleIcon, PencilIcon, EyeIcon, FunnelIcon, ArrowPathIcon, TrashIcon, PrinterIcon } from '../icons/HeroIcons';
import { getQuoteStatusColor, COMPANY_DATA } from '../../constants';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceTemplate from '../invoices/InvoiceTemplate';
import { DetailedInvoiceLineItem, VAT_TYPES, OrderItem } from '../../types';

const QuoteManagementPage: React.FC = () => {
  const { quotes, customers, getQuoteById, convertQuoteToOrder, orders } = useData(); // Added orders
  const { addToast } = useToast();
  const confirmAction = useConfirm();
  const navigate = useNavigate();
  const dataContext = useData(); // Get full context for delete operation

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [viewingQuote, setViewingQuote] = useState<Quote | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isConvertToOrderModalOpen, setIsConvertToOrderModalOpen] = useState(false);
  const [quoteToConvert, setQuoteToConvert] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [detailedQuoteLineItems, setDetailedQuoteLineItems] = useState<DetailedInvoiceLineItem[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isPrintingInvoiceDetail, setIsPrintingInvoiceDetail] = useState(false);

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const customer = customers.find(c => c.id === quote.customerId);
      return (
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer?.name.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        quote.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }).sort((a,b) => new Date(b.quoteDate).getTime() - new Date(a.quoteDate).getTime());
  }, [quotes, customers, searchTerm]);

  const calculateDetailedInvoiceLineItems = (order: Order | null): DetailedInvoiceLineItem[] => {
    if (!order) return [];

    return order.items.map((orderItem: OrderItem) => {
      const hamper = dataContext.getHamperById(orderItem.hamperId);
      const detailedLine: DetailedInvoiceLineItem = {
        hamperId: orderItem.hamperId,
        hamperName: orderItem.hamperName || hamper?.name || 'Cesta Desconocida',
        hamperQuantity: orderItem.quantity,
        hamperUnitPriceBase: orderItem.unitPrice, // This is already base price (ex-VAT)

        baseAmountByVatRate: {},
        vatAmountByVatRate: {},
        totalBaseForLine: 0,
        totalVatForLine: 0,
        totalWithVatForLine: 0,
        componentsDisplay: []
      };

      VAT_TYPES.forEach(rate => {
        detailedLine.baseAmountByVatRate[rate.toString()] = 0;
        detailedLine.vatAmountByVatRate[rate.toString()] = 0;
      });
      
      let totalHamperCostForProportions = 0;
      const costByVatRateForProportions: { [rate: string]: number } = {};
      VAT_TYPES.forEach(rate => costByVatRateForProportions[rate.toString()] = 0);

      if (hamper) {
        detailedLine.componentsDisplay = hamper.components.map(hc => {
          const product = dataContext.getProductById(hc.productId);
          return {
            name: product?.name || 'Producto desconocido',
            quantityPerHamper: hc.quantity,
            unit: product?.unit || 'ud'
          };
        });

        hamper.components.forEach(hc => {
          const product = dataContext.getProductById(hc.productId);
          if (product) {
            const componentCost = product.costPrice * hc.quantity;
            totalHamperCostForProportions += componentCost;
            costByVatRateForProportions[product.vatRate.toString()] = (costByVatRateForProportions[product.vatRate.toString()] || 0) + componentCost;
          }
        });
      }
      
      const lineTotalBasePrice = detailedLine.hamperUnitPriceBase * detailedLine.hamperQuantity;
      detailedLine.totalBaseForLine = lineTotalBasePrice;

      if (totalHamperCostForProportions > 0) {
        VAT_TYPES.forEach(rate => {
          const rateStr = rate.toString();
          const proportion = costByVatRateForProportions[rateStr] / totalHamperCostForProportions;
          const baseForThisRateOnLine = lineTotalBasePrice * proportion;
          detailedLine.baseAmountByVatRate[rateStr] = parseFloat(baseForThisRateOnLine.toFixed(2));
          detailedLine.vatAmountByVatRate[rateStr] = parseFloat((baseForThisRateOnLine * rate).toFixed(2));
        });
      } else if (hamper && hamper.components.length > 0) {
        const distinctVatRates = new Set(hamper.components.map(hc => dataContext.getProductById(hc.productId)?.vatRate).filter(r => r !== undefined));
        if (distinctVatRates.size === 1) {
            const singleRate = distinctVatRates.values().next().value!;
            detailedLine.baseAmountByVatRate[singleRate.toString()] = lineTotalBasePrice;
            detailedLine.vatAmountByVatRate[singleRate.toString()] = parseFloat((lineTotalBasePrice * singleRate!).toFixed(2));
        } 
      } else {
         detailedLine.baseAmountByVatRate["0.21"] = lineTotalBasePrice;
         detailedLine.vatAmountByVatRate["0.21"] = parseFloat((lineTotalBasePrice * 0.21).toFixed(2));
      }

      detailedLine.totalVatForLine = Object.values(detailedLine.vatAmountByVatRate).reduce((sum, val) => sum + val, 0);
      detailedLine.totalWithVatForLine = detailedLine.totalBaseForLine + detailedLine.totalVatForLine;
      
      return detailedLine;
    });
  };

  const openModalForNew = () => {
    setEditingQuote(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (quote: Quote) => {
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const openViewModal = (quoteId: string) => {
    const quoteToView = getQuoteById(quoteId);
    if(quoteToView) {
        setViewingQuote(quoteToView);
        const orderDetails = { // Adapt Quote to Order structure for calculateDetailedInvoiceLineItems
          id: quoteToView.id,
          orderNumber: quoteToView.quoteNumber,
          customerId: quoteToView.customerId,
          items: quoteToView.items.map(item => ({...item, hamperName: item.hamperName, unitPrice: item.unitPrice})), // Ensure correct types
          orderDate: quoteToView.quoteDate,
          status: OrderStatus.DRAFT, // Dummy status
          totalAmount: quoteToView.totalAmount,
          totalVatAmount: quoteToView.totalVatAmount,
          shippingAddress: quoteToView.shippingAddress || '',
          notes: quoteToView.notes,
          paymentMethod: 'N/A'
        };
        setDetailedQuoteLineItems(calculateDetailedInvoiceLineItems(orderDetails));
        setIsViewModalOpen(true);
    } else {
        addToast('Presupuesto no encontrado.', 'error');
    }
  };

  const handleSaveSuccess = () => { 
    setIsModalOpen(false);
    setEditingQuote(null);
  };
  
  const handleDeleteQuote = (quoteId: string) => {
    const quote = getQuoteById(quoteId);
    if (quote && quote.status === QuoteStatus.CONVERTED_TO_ORDER) {
        addToast('No se puede eliminar un presupuesto que ya ha sido convertido a pedido.', 'warning');
        return;
    }
    confirmAction('¿Está seguro de que desea eliminar este presupuesto?', () => {
        try {
            dataContext.deleteQuote(quoteId);
            addToast('Presupuesto eliminado correctamente.', 'success');
        } catch (error) {
            addToast('Error al eliminar el presupuesto.', 'error');
        }
    });
  };

  const handleOpenConvertToOrderModal = (quote: Quote) => {
    if (quote.status === QuoteStatus.CONVERTED_TO_ORDER) {
        addToast('Este presupuesto ya ha sido convertido a pedido.', 'info');
        if(quote.relatedOrderId) navigate(`/orders`); // or navigate to specific order if possible
        return;
    }
    if (quote.status !== QuoteStatus.ACCEPTED && quote.status !== QuoteStatus.SENT && quote.status !== QuoteStatus.DRAFT) {
        addToast(`Solo presupuestos en estado Borrador, Enviado o Aceptado pueden ser convertidos. Estado actual: ${quote.status}`, 'warning');
        return;
    }
    setQuoteToConvert(quote);
    setIsConvertToOrderModalOpen(true);
  };

  const handleConfirmConvertToOrder = () => {
    if (quoteToConvert) {
      const order = convertQuoteToOrder(quoteToConvert.id);
      if (order) {
        addToast(`Presupuesto ${quoteToConvert.quoteNumber} convertido a Pedido ${order.orderNumber}.`, 'success');
        setIsConvertToOrderModalOpen(false);
        setQuoteToConvert(null);
        navigate(`/orders`); // Navigate to orders page, or could open the new order for editing
      } else {
        addToast('Error al convertir el presupuesto a pedido.', 'error');
      }
    }
  };

  const handlePrintQuoteDetail = () => {
    setIsPrintModalOpen(false); 
    window.print();
  };

  const handleShowPdf = () => {
    setIsPdfViewerOpen(true);
    setIsPrintModalOpen(false); // Cierra el modal de selección
  };

  const aggregatedVatSummary = useMemo(() => {
    const summary: { [rate: string]: { base: number, vat: number } } = {};
    VAT_TYPES.forEach(rate => {
      summary[rate.toString()] = { base: 0, vat: 0 };
    });

    detailedQuoteLineItems.forEach(line => {
      VAT_TYPES.forEach(rate => {
        const rateStr = rate.toString();
        summary[rateStr].base += line.baseAmountByVatRate[rateStr] || 0;
        summary[rateStr].vat += line.vatAmountByVatRate[rateStr] || 0;
      });
    });
    return summary;
  }, [detailedQuoteLineItems]);

  // Robust printing effect
   useEffect(() => {
    if (isPrintingInvoiceDetail) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden'; // Prevent scrollbars during print setup
      
      const onAfterPrint = () => {
        setIsPrintingInvoiceDetail(false);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('afterprint', onAfterPrint);
      };

      const onPrintCancel = () => { // Fallback if afterprint doesn't fire (e.g. user cancels print dialog)
        setIsPrintingInvoiceDetail(false);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('afterprint', onAfterPrint); // ensure it's removed
      };
      
      window.addEventListener('afterprint', onAfterPrint);
      
      // Give styles time to apply before printing
      const printTimeout = setTimeout(() => {
        window.print();
        // Fallback if print dialog is closed quickly or afterprint doesn't fire
        const cancelCheckTimeout = setTimeout(onPrintCancel, 500); // Check after 0.5s
        // Clear this specific timeout if afterprint occurs
         window.addEventListener('afterprint', () => clearTimeout(cancelCheckTimeout), { once: true });

      }, 250); // Small delay for styles

      return () => {
        clearTimeout(printTimeout);
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('afterprint', onAfterPrint);
      };
    }
  }, [isPrintingInvoiceDetail]);


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Gestión de Presupuestos</h1>
        <div className="flex items-center gap-x-2 w-full md:w-auto">
             <Input
              type="text"
              placeholder="Buscar presupuestos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="mb-0 flex-grow"
              rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
            />
            <Button onClick={openModalForNew} leftIcon={<PlusCircleIcon className="h-5 w-5"/>} className="whitespace-nowrap">
              Nuevo Presupuesto
            </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingQuote ? `Editar Presupuesto: ${editingQuote.quoteNumber}` : 'Nuevo Presupuesto'} size="2xl">
        <QuoteForm quote={editingQuote} onSaveSuccess={handleSaveSuccess} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title={`Detalles Presupuesto: ${viewingQuote?.quoteNumber}`} size="4xl">
        {viewingQuote && (
          <div className="invoice-printable-content space-y-3 p-0.5">
             <h1 className="text-center print:block hidden">PRESUPUESTO</h1>
            <div className="grid grid-cols-2 gap-4 mb-4 print:mb-3 px-4 pt-4 print:px-0 print:pt-0">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Datos Emisor:</h2>
                <p className="text-sm">{COMPANY_DATA.name}</p>
                <p className="text-sm">{COMPANY_DATA.address}</p>
                <p className="text-sm">CIF: {COMPANY_DATA.cif}</p>
                <p className="text-sm">Tel: {COMPANY_DATA.phone} - Web: {COMPANY_DATA.website}</p>
              </div>
              <div className="text-right">
                <div className="bg-neutral-200 h-16 w-40 inline-block flex items-center justify-center text-neutral-500 print:border print:border-gray-300">
                   Logo Empresa
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 border border-neutral-300 rounded-lg shadow-sm bg-white print:border-neutral-400 print:shadow-none print:bg-transparent">
              <div>
                <h2 className="text-xl font-bold text-primary-dark mb-1">Presupuesto Nº: {viewingQuote.quoteNumber}</h2>
                <p className="text-sm"><strong>Fecha Emisión:</strong> {new Date(viewingQuote.quoteDate).toLocaleDateString()}</p>
                {viewingQuote.expiryDate && <p className="text-sm"><strong>Fecha Vencimiento:</strong> {new Date(viewingQuote.expiryDate).toLocaleDateString()}</p>}
                <p className="text-sm"><strong>Estado:</strong> <span className={`px-2 py-0.5 text-xs rounded-full ${getQuoteStatusColor(viewingQuote.status)} print:border print:border-gray-300`}>{viewingQuote.status}</span></p>
              </div>
              <div className="text-left md:text-right">
                 <h3 className="text-md font-semibold text-neutral-800">Cliente:</h3>
                {(() => {
                  const customer = customers.find(c => c.id === viewingQuote.customerId);
                  return (
                    <>
                      <p className="text-sm">{customer?.name || 'Cliente no encontrado'}</p>
                      <p className="text-sm">{customer?.address || 'Dirección no especificada'}</p>
                      <p className="text-sm">{customer?.cifNif || 'CIF/NIF no especificado'}</p>
                    </>
                  );
                })()}
              </div>
            </div>
            
            <div className="mt-3 px-1 print:px-0">
                <h3 className="text-lg font-semibold text-neutral-800 mb-1">Detalle de Artículos:</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 border border-neutral-300 rounded-md print:border-gray-400">
                        <thead className="bg-neutral-100 print:bg-gray-100">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-600 uppercase">Descripción</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-neutral-600 uppercase">Cant.</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600 uppercase">P.Unit (Base)</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600 uppercase">Base Línea</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600 uppercase">IVA Línea</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-neutral-600 uppercase">Total Línea</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200 print:divide-gray-400">
                            {detailedQuoteLineItems.map((line, index) => (
                                <Fragment key={`line-${line.hamperId}-${index}`}>
                                  <tr>
                                      <td className="px-3 py-2 whitespace-normal text-sm font-semibold text-neutral-700">{line.hamperName}</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700 text-center">{line.hamperQuantity}</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700 text-right">{line.hamperUnitPriceBase.toFixed(2)}€</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700 text-right">{line.totalBaseForLine.toFixed(2)}€</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-neutral-700 text-right">{line.totalVatForLine.toFixed(2)}€</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold text-neutral-800 text-right">{line.totalWithVatForLine.toFixed(2)}€</td>
                                  </tr>
                                  {line.componentsDisplay.map((comp, compIndex) => (
                                    <tr key={`comp-${line.hamperId}-${index}-${compIndex}`} className="constituent-product-row">
                                        <td className="pl-6 py-1 pr-3 text-xs text-neutral-600 italic" colSpan={3}> &#8627; {comp.name} (x{comp.quantityPerHamper} {comp.unit})</td>
                                        <td className="py-1 text-xs text-neutral-600 italic text-right" colSpan={3}></td>
                                    </tr>
                                  ))}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="invoice-vat-summary mt-3 text-right">
                <h3 className="text-md font-semibold text-neutral-700 mb-1">Desglose de IVA:</h3>
                <table className="w-auto ml-auto text-sm border border-neutral-300">
                    <thead className="bg-neutral-100">
                        <tr>
                            <th className="px-3 py-1.5 text-left text-xs font-medium text-neutral-600 uppercase">Tipo IVA</th>
                            <th className="px-3 py-1.5 text-right text-xs font-medium text-neutral-600 uppercase">Base Imponible</th>
                            <th className="px-3 py-1.5 text-right text-xs font-medium text-neutral-600 uppercase">Cuota IVA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {VAT_TYPES.filter(rate => aggregatedVatSummary[rate.toString()].base > 0 || aggregatedVatSummary[rate.toString()].vat > 0).map(rate => (
                            <tr key={`vat-summary-${rate}`}>
                                <td className="px-3 py-1.5 text-left text-neutral-700">{(rate * 100).toFixed(0)}%</td>
                                <td className="px-3 py-1.5 text-right text-neutral-700">{aggregatedVatSummary[rate.toString()].base.toFixed(2)}€</td>
                                <td className="px-3 py-1.5 text-right text-neutral-700">{aggregatedVatSummary[rate.toString()].vat.toFixed(2)}€</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="invoice-totals-summary mt-3 p-4 border-t-2 border-neutral-700 text-right">
              <p className="text-md text-neutral-700"><strong>Subtotal (Base Imponible):</strong> {viewingQuote.totalAmount.toFixed(2)}€</p>
              <p className="text-md text-neutral-700"><strong>Total IVA:</strong> {viewingQuote.totalVatAmount.toFixed(2)}€</p>
              <p className="text-xl font-bold text-primary-dark mt-1">TOTAL PRESUPUESTO: {(viewingQuote.totalAmount + viewingQuote.totalVatAmount).toFixed(2)}€</p>
            </div>
            {viewingQuote.notes && <p className="invoice-notes-print mt-3 px-1 print:px-0 text-sm text-neutral-600"><strong>Notas:</strong> {viewingQuote.notes}</p>}
            {viewingQuote.status === QuoteStatus.CONVERTED_TO_ORDER && viewingQuote.relatedOrderId && 
                <p className="mt-2 text-sm text-green-600">Convertido al pedido: {orders.find(o => o.id === viewingQuote.relatedOrderId)?.orderNumber}</p>
            }
          </div>
        )}
        <div className="flex justify-end space-x-3 modal-footer-print-hide">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Cerrar</Button>
            <Button variant="secondary" onClick={() => setIsPrintModalOpen(true)} leftIcon={<PrinterIcon className="h-5 w-5"/>}>Imprimir</Button>
        </div>
      </Modal>

      {/* Modal de Selección de Impresión */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Seleccionar Formato de Impresión"
        size="md"
      >
        <div className="flex flex-col space-y-4">
            <Button onClick={handleShowPdf}>Imprimir Presupuesto Completo (PDF)</Button>
            <Button onClick={handlePrintQuoteDetail} variant="outline">Imprimir solo datos (para papel preimpreso)</Button>
        </div>
      </Modal>

      {/* Modal para el Visor de PDF */}
      {viewingQuote && (
          <Modal isOpen={isPdfViewerOpen} onClose={() => setIsPdfViewerOpen(false)} title={`PDF Presupuesto: ${viewingQuote.quoteNumber}`} size="full">
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
                <InvoiceTemplate 
                    invoice={{
                      id: viewingQuote.id,
                      invoiceNumber: viewingQuote.quoteNumber,
                      orderId: viewingQuote.id, // Usamos el ID del presupuesto como orderId dummy
                      issueDate: viewingQuote.quoteDate,
                      dueDate: viewingQuote.expiryDate || viewingQuote.quoteDate, // Usamos expiryDate si existe, sino quoteDate
                      paymentStatus: PaymentStatus.PENDING, // Estado de pago dummy para el presupuesto
                      customerName: customers.find(c => c.id === viewingQuote.customerId)?.name || 'Cliente no encontrado',
                      customerAddress: customers.find(c => c.id === viewingQuote.customerId)?.address,
                      customerCifNif: customers.find(c => c.id === viewingQuote.customerId)?.cifNif,
                      totalAmount: viewingQuote.totalAmount,
                      totalVatAmount: viewingQuote.totalVatAmount,
                      grandTotal: viewingQuote.totalAmount + viewingQuote.totalVatAmount,
                      notes: viewingQuote.notes,
                    }}
                    customer={customers.find(c => c.id === viewingQuote.customerId)!}
                    company={COMPANY_DATA}
                    documentType="quote"
                />
            </PDFViewer>
        </Modal>
      )}

      {/* Modal for "Convert to Order" */}
      <Modal 
        isOpen={isConvertToOrderModalOpen && !!quoteToConvert} 
        onClose={() => setIsConvertToOrderModalOpen(false)} 
        title={`Convertir Presupuesto ${quoteToConvert?.quoteNumber} a Pedido`} 
        size="md" // Adjusted size for simple confirmation
      >
        {quoteToConvert && (
             <div>
                <p className="mb-4">Está a punto de convertir el presupuesto <strong>{quoteToConvert.quoteNumber}</strong> para el cliente <strong>{customers.find(c=>c.id === quoteToConvert.customerId)?.name}</strong> en un nuevo pedido.</p>
                <p className="mb-2"><strong>Total Presupuesto:</strong> {(quoteToConvert.totalAmount + quoteToConvert.totalVatAmount).toFixed(2)}€</p>
                <p className="text-sm text-neutral-600 mb-6">El nuevo pedido se creará con estado "{OrderStatus.PENDING_PAYMENT}". Podrá editarlo después si es necesario.</p>
                <div className="flex justify-end space-x-3">
                    <Button variant="outline" onClick={() => setIsConvertToOrderModalOpen(false)}>Cancelar</Button>
                    <Button variant="primary" onClick={handleConfirmConvertToOrder} leftIcon={<ArrowPathIcon className="h-5 w-5"/>}>Confirmar Conversión</Button>
                </div>
            </div>
        )}
      </Modal>


      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nº Pres.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredQuotes.map((quote) => {
              const customer = customers.find(c => c.id === quote.customerId);
              const canConvertToOrder = [QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.ACCEPTED].includes(quote.status);
              return (
                <tr key={quote.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-DEFAULT hover:underline cursor-pointer" onClick={() => openViewModal(quote.id)}>{quote.quoteNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{customer?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{new Date(quote.quoteDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{(quote.totalAmount + quote.totalVatAmount).toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <div className="flex items-center space-x-2">
                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getQuoteStatusColor(quote.status)}`}>
                          {quote.status}
                       </span>
                       {canConvertToOrder && (
                         <span className="text-xs text-green-600 font-medium" title="Puede convertirse a pedido">
                           ✓ Convertible
                         </span>
                       )}
                     </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => openViewModal(quote.id)} aria-label="Ver Presupuesto" title="Ver Detalles">
                          <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700"/>
                      </Button>
                      {quote.status !== QuoteStatus.CONVERTED_TO_ORDER && (
                          <Button variant="ghost" size="sm" onClick={() => openModalForEdit(quote)} aria-label="Editar Presupuesto" title="Editar">
                              <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800"/>
                          </Button>
                      )}
                      {canConvertToOrder && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             onClick={() => handleOpenConvertToOrderModal(quote)} 
                             title="Convertir a Pedido"
                             className="text-green-600 border-green-600 hover:bg-green-50 hover:border-green-700"
                           >
                              <ArrowPathIcon className="h-4 w-4 mr-1"/>
                              Pedido
                          </Button>
                      )}
                       {quote.status !== QuoteStatus.CONVERTED_TO_ORDER && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteQuote(quote.id)} aria-label="Eliminar Presupuesto" title="Eliminar">
                              <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-800"/>
                          </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
             {filteredQuotes.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                       {quotes.length === 0 ? "No hay presupuestos registrados. Comience creando uno." : "No se encontraron presupuestos que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuoteManagementPage;
