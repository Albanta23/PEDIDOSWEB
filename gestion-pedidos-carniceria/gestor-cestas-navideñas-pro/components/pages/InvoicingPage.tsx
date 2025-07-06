import React, { useState, useMemo, useEffect, Fragment } from 'react';
import { Invoice, Order, PaymentStatus, DetailedInvoiceLineItem, VAT_TYPES, OrderItem } from '../../types';
import { useData, useConfirm } from '../../contexts/DataContext';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/forms/Input';
import Select from '../shared/forms/Select';
import { EyeIcon, FunnelIcon, PencilIcon, PrinterIcon } from '../icons/HeroIcons';
import { getPaymentStatusColor, PAYMENT_STATUS_OPTIONS, COMPANY_DATA } from '../../constants';
import { PDFViewer } from '@react-pdf/renderer';
import InvoiceTemplate from '../invoices/InvoiceTemplate';

const InvoicingPage: React.FC = () => {
  const { invoices, orders, customers, getOrderById, getHamperById, updateInvoice, getProductById } = useData();
  const { addToast } = useToast();
  const confirmAction = useConfirm();

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);
  const [detailedInvoiceLineItems, setDetailedInvoiceLineItems] = useState<DetailedInvoiceLineItem[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditStatusModalOpen, setIsEditStatusModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDING);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPrintingInvoiceDetail, setIsPrintingInvoiceDetail] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);

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

  const filteredInvoices = useMemo(() => {
    return invoices.filter(invoice =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orders.find(o => o.id === invoice.orderId)?.orderNumber.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      invoice.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [invoices, orders, searchTerm]);


  const calculateDetailedInvoiceLineItems = (order: Order | null): DetailedInvoiceLineItem[] => {
    if (!order) return [];

    return order.items.map((orderItem: OrderItem) => {
      const hamper = getHamperById(orderItem.hamperId);
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
          const product = getProductById(hc.productId);
          return {
            name: product?.name || 'Producto desconocido',
            quantityPerHamper: hc.quantity,
            unit: product?.unit || 'ud'
          };
        });

        hamper.components.forEach(hc => {
          const product = getProductById(hc.productId);
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
        // Fallback: if no cost, but components exist, distribute base price equally among components and use their VAT rates
        // Or, more simply, if there's only one VAT rate among components, use that.
        // For now, if no cost, we might default to a common rate or sum up. This part could be complex.
        // The most accurate would be to check if all products in hamper have same VAT rate
        const distinctVatRates = new Set(hamper.components.map(hc => getProductById(hc.productId)?.vatRate).filter(r => r !== undefined));
        if (distinctVatRates.size === 1) {
            const singleRate = distinctVatRates.values().next().value!;
            detailedLine.baseAmountByVatRate[singleRate.toString()] = lineTotalBasePrice;
            detailedLine.vatAmountByVatRate[singleRate.toString()] = parseFloat((lineTotalBasePrice * singleRate!).toFixed(2));
        } else {
             // Fallback to applying the order's overall totalVatAmount proportionally if complex mix and no costs
             // This is simpler: the order totalVatAmount IS the source of truth from DataContext.
             // We can use the order.totalVatAmount / order.totalAmount as an effective rate for this line.
             // However, for breakdown by type, this doesn't help.
             // The most robust fallback if cost proportions are zero is to use the VAT rate of the most "significant" item or a default.
             // For now, let's keep it based on cost proportion, if that fails, VAT might appear as 0 for this line breakdown method.
             // The invoice total VAT from `viewingInvoice.totalVatAmount` should be the final sum.
        }
      } else {
         // No hamper or no components: apply a default 21% to the whole line for breakdown purposes
         detailedLine.baseAmountByVatRate["0.21"] = lineTotalBasePrice;
         detailedLine.vatAmountByVatRate["0.21"] = parseFloat((lineTotalBasePrice * 0.21).toFixed(2));
      }

      detailedLine.totalVatForLine = Object.values(detailedLine.vatAmountByVatRate).reduce((sum, val) => sum + val, 0);
      detailedLine.totalWithVatForLine = detailedLine.totalBaseForLine + detailedLine.totalVatForLine;
      
      return detailedLine;
    });
  };


  const openInvoiceModal = (invoice: Invoice) => {
    setViewingInvoice(invoice);
    const orderDetails = getOrderById(invoice.orderId);
    setViewingOrderDetails(orderDetails || null);
    if (orderDetails) {
      setDetailedInvoiceLineItems(calculateDetailedInvoiceLineItems(orderDetails));
    } else {
      setDetailedInvoiceLineItems([]);
    }
    setIsViewModalOpen(true);
  };

  const openEditStatusModal = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setNewPaymentStatus(invoice.paymentStatus);
    setIsEditStatusModalOpen(true);
  };

  const handleUpdatePaymentStatus = () => {
    if (editingInvoice) {
        confirmAction(`¿Confirmar cambio de estado de pago a "${newPaymentStatus}" para la factura ${editingInvoice.invoiceNumber}?`, () => {
            try {
                updateInvoice({ ...editingInvoice, paymentStatus: newPaymentStatus });
                addToast('Estado de pago actualizado.', 'success');
                setIsEditStatusModalOpen(false);
                setEditingInvoice(null);
            } catch (error) {
                addToast('Error al actualizar el estado de pago.', 'error');
            }
        });
    }
  };
  
  const handlePrintInvoiceDetail = () => {
    setIsPrintingInvoiceDetail(true);
    setIsPrintModalOpen(false); // Cierra el modal de selección
  };

  const handleShowPdf = () => {
    setIsPdfViewerOpen(true);
    setIsPrintModalOpen(false); // Cierra el modal de selección
  };

  const getCustomerForInvoice = (invoice: Invoice) => {
      const order = orders.find(o => o.id === invoice.orderId);
      return customers.find(c => c.id === order?.customerId);
  }

  const viewModalFooter = viewingInvoice ? (
    <div className="flex justify-end space-x-3 modal-footer-print-hide">
        <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Cerrar</Button>
        <Button variant="secondary" onClick={() => setIsPrintModalOpen(true)} leftIcon={<PrinterIcon className="h-5 w-5"/>}>Imprimir</Button>
    </div>
  ) : undefined;

  const aggregatedVatSummary = useMemo(() => {
    const summary: { [rate: string]: { base: number, vat: number } } = {};
    VAT_TYPES.forEach(rate => {
      summary[rate.toString()] = { base: 0, vat: 0 };
    });

    detailedInvoiceLineItems.forEach(line => {
      VAT_TYPES.forEach(rate => {
        const rateStr = rate.toString();
        summary[rateStr].base += line.baseAmountByVatRate[rateStr] || 0;
        summary[rateStr].vat += line.vatAmountByVatRate[rateStr] || 0;
      });
    });
    return summary;
  }, [detailedInvoiceLineItems]);


  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-semibold text-neutral-900">Facturas Emitidas</h1>
         <Input
            type="text"
            placeholder="Buscar facturas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0 flex-grow max-w-md"
            rightAdornment={<FunnelIcon className="h-5 w-5 text-gray-400" />}
        />
      </div>

      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)} 
        title={isPrintingInvoiceDetail ? `Factura: ${viewingInvoice?.invoiceNumber}` : `Visualizar Factura: ${viewingInvoice?.invoiceNumber}`}
        size="4xl" 
        footer={viewModalFooter}
        isPrintingCurrently={isPrintingInvoiceDetail}
        id="invoiceDetailModal"
      >
        {viewingInvoice && (
          <div className="invoice-printable-content space-y-3 p-0.5">
             <h1 className="text-center print:block hidden">FACTURA</h1>
            <div className="grid grid-cols-2 gap-4 mb-4 print:mb-3 px-4 pt-4 print:px-0 print:pt-0">
              <div>
                <h2 className="text-lg font-semibold text-neutral-800">Datos Emisor:</h2>
                <p className="text-sm">Cestas Pro S.L. (Ejemplo)</p>
                <p className="text-sm">Calle de la Innovación, 123</p>
                <p className="text-sm">28080, Madrid, España</p>
                <p className="text-sm">NIF: B00000000</p>
              </div>
              <div className="text-right">
                <div className="bg-neutral-200 h-16 w-40 inline-block flex items-center justify-center text-neutral-500 print:border print:border-gray-300">
                   Logo Empresa
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 p-4 border border-neutral-300 rounded-lg shadow-sm bg-white print:border-neutral-400 print:shadow-none print:bg-transparent">
              <div>
                <h2 className="text-xl font-bold text-primary-dark mb-1">Factura Nº: {viewingInvoice.invoiceNumber}</h2>
                <p className="text-sm"><strong>Pedido Original:</strong> {viewingOrderDetails?.orderNumber || 'N/A'}</p>
                <p className="text-sm"><strong>Fecha Emisión:</strong> {new Date(viewingInvoice.issueDate).toLocaleDateString()}</p>
                <p className="text-sm"><strong>Fecha Vencimiento:</strong> {new Date(viewingInvoice.dueDate).toLocaleDateString()}</p>
                <p className="text-sm"><strong>Estado Pago:</strong> <span className={`px-2 py-0.5 text-xs rounded-full ${getPaymentStatusColor(viewingInvoice.paymentStatus)} print:border print:border-gray-300`}>{viewingInvoice.paymentStatus}</span></p>
              </div>
              <div className="text-left md:text-right">
                 <h3 className="text-md font-semibold text-neutral-800">Cliente:</h3>
                <p className="text-sm">{viewingInvoice.customerName}</p>
                <p className="text-sm">{viewingInvoice.customerAddress || 'Dirección no especificada'}</p>
                <p className="text-sm">{viewingInvoice.customerCifNif || 'CIF/NIF no especificado'}</p>
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
                            {detailedInvoiceLineItems.map((line, index) => (
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
              <p className="text-md text-neutral-700"><strong>Subtotal (Base Imponible):</strong> {viewingInvoice.totalAmount.toFixed(2)}€</p>
              <p className="text-md text-neutral-700"><strong>Total IVA:</strong> {viewingInvoice.totalVatAmount.toFixed(2)}€</p>
              <p className="text-xl font-bold text-primary-dark mt-1">TOTAL FACTURA: {viewingInvoice.grandTotal.toFixed(2)}€</p>
            </div>
            {viewingInvoice.notes && <p className="invoice-notes-print mt-3 px-1 print:px-0 text-sm text-neutral-600"><strong>Notas:</strong> {viewingInvoice.notes}</p>}
          </div>
        )}
      </Modal>

      {/* Modal de Selección de Impresión */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Seleccionar Formato de Impresión"
        size="md"
      >
        <div className="flex flex-col space-y-4">
            <Button onClick={handleShowPdf}>Imprimir Factura Completa (PDF)</Button>
            <Button onClick={handlePrintInvoiceDetail} variant="outline">Imprimir solo datos (para papel preimpreso)</Button>
        </div>
      </Modal>

      {/* Modal para el Visor de PDF */}
      {viewingInvoice && (
          <Modal isOpen={isPdfViewerOpen} onClose={() => setIsPdfViewerOpen(false)} title={`PDF Factura: ${viewingInvoice.invoiceNumber}`} size="full">
            <PDFViewer style={{ width: '100%', height: '80vh' }}>
                <InvoiceTemplate 
                    invoice={viewingInvoice} 
                    customer={getCustomerForInvoice(viewingInvoice)!}
                    company={COMPANY_DATA}
                    documentType="invoice"
                />
            </PDFViewer>
        </Modal>
      )}

      <Modal 
        isOpen={isEditStatusModalOpen} 
        onClose={() => setIsEditStatusModalOpen(false)} 
        title={`Actualizar Estado de Pago: ${editingInvoice?.invoiceNumber}`}
        size="md"
        showConfirmButtons
        onConfirm={handleUpdatePaymentStatus}
        confirmText="Actualizar Estado"
        cancelText="Cancelar"
      >
        {editingInvoice && (
            <Select
                label="Nuevo Estado de Pago"
                value={newPaymentStatus}
                onChange={(e) => setNewPaymentStatus(e.target.value as PaymentStatus)}
                options={PAYMENT_STATUS_OPTIONS}
            />
        )}
      </Modal>

      <div className="bg-white shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nº Factura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nº Pedido</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Fecha Emisión</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Estado Pago</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {filteredInvoices.map((invoice) => {
              const order = orders.find(o => o.id === invoice.orderId);
              return (
                <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-DEFAULT hover:underline cursor-pointer" onClick={() => openInvoiceModal(invoice)}>{invoice.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{order?.orderNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{invoice.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700">{invoice.grandTotal.toFixed(2)}€</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus}
                     </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => openInvoiceModal(invoice)} aria-label="Ver Factura" title="Ver Detalles">
                        <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700"/>
                    </Button>
                     {invoice.paymentStatus !== PaymentStatus.PAID && invoice.paymentStatus !== PaymentStatus.CANCELLED && (
                        <Button variant="ghost" size="sm" onClick={() => openEditStatusModal(invoice)} aria-label="Cambiar Estado de Pago" title="Cambiar Estado Pago">
                            <PencilIcon className="h-5 w-5 text-blue-600 hover:text-blue-800"/>
                        </Button>
                    )}
                  </td>
                </tr>
              );
            })}
             {filteredInvoices.length === 0 && (
                <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-neutral-500">
                        {invoices.length === 0 ? "No hay facturas generadas." : "No se encontraron facturas que coincidan con su búsqueda."}
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicingPage;
