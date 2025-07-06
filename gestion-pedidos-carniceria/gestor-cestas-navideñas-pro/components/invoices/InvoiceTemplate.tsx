import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Invoice, Customer, Company } from '../../types'; // Asegúrate que las rutas y tipos son correctos

// Estilos para el PDF, inspirados en la factura original
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 30,
    paddingLeft: 40,
    paddingRight: 40,
    paddingBottom: 50, // Espacio para el footer
    lineHeight: 1.5,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '2px solid #D3D3D3',
    paddingBottom: 10,
  },
  companyDetails: {
    textAlign: 'right',
  },
  invoiceDetails: {
    border: '1px solid #999',
    padding: '5px 10px',
    borderRadius: 5,
    width: '45%',
  },
  customerDetails: {
    width: '45%',
    textAlign: 'right',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#000',
    borderBottomWidth: 1,
    alignItems: 'center',
    height: 24,
  },
  tableHeader: {
    backgroundColor: '#EFEFEF',
    fontWeight: 'bold',
  },
  tableCol: {
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 5,
  },
  colRef: { width: '15%' },
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'right' },
  colPrice: { width: '15%', textAlign: 'right' },
  colVat: { width: '10%', textAlign: 'right' },
  colTotal: { width: '15%', textAlign: 'right' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  totalsTable: {
    width: '50%',
    border: '1px solid #999',
    borderRadius: 5,
    padding: 5,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: '2px 5px',
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: 'grey',
    borderTop: '1px solid #D3D3D3',
    paddingTop: 5,
  },
  logo: {
    width: 70,
    height: 70,
    marginRight: 20,
  }
});

interface InvoiceTemplateProps {
  invoice: Invoice; // Seguiremos usando la estructura de Invoice por simplicidad
  customer: Customer;
  company: Company;
  documentType: 'invoice' | 'quote';
}

const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ invoice, customer, company, documentType }) => {
  const docNumberLabel = documentType === 'invoice' ? 'Nº Factura:' : 'Nº Presupuesto:';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.headerContainer}>
          <Image style={styles.logo} src="/home/jcf2025dv/Descargas/gestor-cestas-navideñas-pro/public/EMB.jpg" />
          <View style={styles.companyDetails}>
            <Text>{company.name}</Text>
            <Text>{company.address}</Text>
            <Text>CIF: {company.cif}</Text>
            <Text>Tel: {company.phone} - Web: {company.website}</Text>
          </View>
        </View>

        {/* Detalles de Factura y Cliente */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <View style={styles.invoiceDetails}>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>{docNumberLabel}</Text><Text>{invoice.invoiceNumber}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Fecha:</Text><Text>{new Date(invoice.issueDate).toLocaleDateString()}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>Cliente:</Text><Text>{customer.id}</Text></View>
              <View style={styles.detailItem}><Text style={styles.detailLabel}>N.I.F.:</Text><Text>{customer.cifNif || customer.cif || 'N/A'}</Text></View>
          </View>
          <View style={styles.customerDetails}>
              <Text>{customer.name}</Text>
              <Text>{customer.address}</Text>
          </View>
        </View>

        {/* Tabla de Artículos */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCol, styles.colRef]}>Ref.</Text>
            <Text style={[styles.tableCol, styles.colDesc]}>Descripción</Text>
            <Text style={[styles.tableCol, styles.colQty]}>Cant.</Text>
            <Text style={[styles.tableCol, styles.colPrice]}>Precio</Text>
            <Text style={[styles.tableCol, styles.colVat]}>%IVA</Text>
            <Text style={[styles.tableCol, styles.colTotal]}>Importe</Text>
          </View>
          {/* Placeholder for items - needs to be implemented based on actual data structure */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCol, styles.colRef]}>CESTA-001</Text>
            <Text style={[styles.tableCol, styles.colDesc]}>Cesta Navideña</Text>
            <Text style={[styles.tableCol, styles.colQty]}>1</Text>
            <Text style={[styles.tableCol, styles.colPrice]}>50.00€</Text>
            <Text style={[styles.tableCol, styles.colVat]}>21%</Text>
            <Text style={[styles.tableCol, styles.colTotal]}>50.00€</Text>
          </View>
        </View>

        {/* Resumen y Totales */}
        <View style={styles.summaryContainer}>
          <View style={styles.totalsTable}>
              <View style={styles.totalRow}><Text>Base Imponible:</Text><Text>{invoice.totalAmount.toFixed(2)}€</Text></View>
              <View style={styles.totalRow}><Text>Total IVA:</Text><Text>{invoice.totalVatAmount.toFixed(2)}€</Text></View>
              <View style={[styles.totalRow, { marginTop: 5, borderTop: '1px solid #999', paddingTop: 5 }]}><Text style={styles.totalLabel}>TOTAL:</Text><Text style={styles.totalLabel}>{invoice.grandTotal.toFixed(2)}€</Text></View>
          </View>
        </View>

        {/* Pie de página */}
        <View style={styles.footer}>
          <Text>
            {company.legalText}
          </Text>
          <Text>
            Inscrita en el Registro Mercantil de {company.registryInfo} - C.I.F.: {company.cif}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;