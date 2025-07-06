// types for payment methods
export interface PaymentMethod {
  FPago: string; // code
  DescripcionFpago: string;
  NumPagos: number;
  Dias1?: number;
  Dias2?: number;
  Dias3?: number;
  Manual: boolean;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { FPago: 'CONFIRMINGFF', DescripcionFpago: 'Confirming Con Vencimiento Fecha Fija', NumPagos: 1, Manual: true },
  { FPago: 'CONTADO', DescripcionFpago: 'Pago Contado', NumPagos: 1, Manual: true },
  { FPago: 'CONTRAREEMBO', DescripcionFpago: 'Contrareembolso', NumPagos: 1, Manual: true },
  { FPago: 'PAG30', DescripcionFpago: 'Pagaré 30 Días Fecha Factura', NumPagos: 1, Dias1: 30, Manual: false },
  { FPago: 'PAG30-60', DescripcionFpago: 'Pagaré 30/60 Días', NumPagos: 2, Dias1: 30, Dias2: 60, Manual: false },
  { FPago: 'PAG60', DescripcionFpago: 'Pagaré 60 Días Fecha Factura', NumPagos: 1, Dias1: 60, Manual: false },
  { FPago: 'PAG90', DescripcionFpago: 'Pagaré 90 Días Fecha Factura', NumPagos: 1, Dias1: 90, Manual: false },
  { FPago: 'REC0', DescripcionFpago: 'Recibo a la Vista', NumPagos: 1, Dias1: 0, Manual: false },
  { FPago: 'REC30', DescripcionFpago: 'Recibo a 30 Días', NumPagos: 1, Dias1: 30, Manual: false },
  { FPago: 'REC60', DescripcionFpago: 'Recibo a 60 Días', NumPagos: 1, Dias1: 60, Manual: false },
  { FPago: 'RECIBO FIJO', DescripcionFpago: 'Recibo con Fecha Fija de Vencimiento', NumPagos: 1, Manual: true },
  { FPago: 'TALON', DescripcionFpago: 'Talon a la entrega de la mercancia.', NumPagos: 1, Manual: true },
  { FPago: 'TRANS.DIA FI', DescripcionFpago: 'Transferencia dia fijo', NumPagos: 1, Manual: true },
  { FPago: 'TRANSF. 30 D', DescripcionFpago: 'Transferencia a 30 dias Fecha Factura', NumPagos: 1, Dias1: 30, Manual: false },
  { FPago: 'TRANSF. 60 D', DescripcionFpago: 'Transferencia a 60 Días Fecha Factura', NumPagos: 1, Dias1: 60, Manual: false },
  { FPago: 'TRANSF. 90 D', DescripcionFpago: 'Transferencia a 90 dias Fecha Factura', NumPagos: 1, Dias1: 90, Manual: false },
  { FPago: 'TRANSFERENCI', DescripcionFpago: 'Transferencia antes del envío.', NumPagos: 1, Manual: true },
  { FPago: 'TRESRECIBO', DescripcionFpago: 'Recibo a 30/60/90 Días Fecha Factura', NumPagos: 3, Dias1: 30, Dias2: 60, Dias3: 90, Manual: false },
];
