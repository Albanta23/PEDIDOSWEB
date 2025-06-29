// Prueba del endpoint de envío de proveedor con PDF corregido
const { cabeceraPDF, piePDF } = require('./src/utils/exportPDFBase.js');
const jsPDF = require('jspdf');

async function testProveedorPDF() {
  console.log('🧪 Probando generación de PDF para proveedor...');
  
  try {
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Aplicar cabecera
    await cabeceraPDF(doc);
    
    let y = 48;
    doc.setFontSize(20);
    doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
    y += 12;
    
    doc.setFontSize(14);
    doc.text('Tienda: Test', 14, y);
    y += 9;
    
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
    y += 11;
    
    // Tabla de datos
    doc.setFontSize(14);
    doc.text('Referencia', 14, y);
    doc.text('Cantidad', 70, y);
    doc.text('Unidad', 110, y);
    y += 8;
    
    doc.setLineWidth(0.3);
    doc.line(14, y, 150, y);
    y += 5;
    
    doc.setFontSize(13);
    
    // Datos de prueba
    const lineasTest = [
      { referencia: 'REF001', cantidad: '5', unidad: 'kg' },
      { referencia: 'REF002', cantidad: '3', unidad: 'ud' }
    ];
    
    lineasTest.forEach(l => {
      if (l.referencia && l.cantidad) {
        doc.text(String(l.referencia).toUpperCase(), 14, y);
        doc.text(String(l.cantidad), 70, y);
        doc.text(String(l.unidad || 'kg'), 110, y);
        y += 9;
      }
    });
    
    // Aplicar pie
    piePDF(doc);
    
    // Generar base64
    let pdfBase64 = doc.output('datauristring');
    if (pdfBase64.startsWith('data:')) {
      pdfBase64 = pdfBase64.substring(pdfBase64.indexOf(',') + 1);
    }
    
    console.log('✅ PDF generado correctamente');
    console.log('📄 Tamaño base64:', pdfBase64.length, 'caracteres');
    console.log('📄 Preview base64 (primeros 100 chars):', pdfBase64.substring(0, 100) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    return false;
  }
}

// Simular el endpoint
async function testEndpoint() {
  console.log('🌐 Simulando llamada al endpoint...');
  
  const bodyData = {
    tienda: 'Tienda Test',
    tiendaId: 'test-123',
    fecha: new Date().toLocaleDateString(),
    lineas: [
      { referencia: 'REF001', cantidad: '5', unidad: 'kg' },
      { referencia: 'REF002', cantidad: '3', unidad: 'ud' }
    ],
    pdfBase64: 'test-base64-data',
    forzarTextoPlano: false
  };
  
  console.log('📤 Datos del body:', JSON.stringify(bodyData, null, 2));
  console.log('✅ Simulación del endpoint completada');
}

async function runTest() {
  console.log('🚀 Iniciando prueba de corrección del envío de proveedor...\n');
  
  const pdfOk = await testProveedorPDF();
  if (pdfOk) {
    await testEndpoint();
    console.log('\n🎉 Prueba completada exitosamente');
  } else {
    console.log('\n💥 Prueba falló en la generación de PDF');
  }
}

runTest();
