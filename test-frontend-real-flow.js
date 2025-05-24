// Prueba del flujo real del frontend: simular botón "Enviar a Proveedor"
const axios = require('axios');
const { jsPDF } = require('jspdf');

// Función para generar PDF (simulando la función del frontend)
function generatePDF() {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    let y = 18;
    
    doc.setFontSize(15);
    doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10);
    doc.text('Tienda: Tienda Test', 14, y);
    y += 6;
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text('Referencia', 14, y);
    doc.text('Cantidad', 80, y);
    y += 6;
    doc.setLineWidth(0.2);
    doc.line(14, y, 120, y);
    y += 3;
    doc.setFontSize(10);
    
    // Agregar líneas de prueba
    const lineas = [
        { referencia: 'PROD001', cantidad: 5 },
        { referencia: 'PROD002', cantidad: 3 }
    ];
    
    lineas.forEach(l => {
        doc.text(String(l.referencia), 14, y);
        doc.text(String(l.cantidad), 80, y);
        y += 5;
    });
    
    doc.setFontSize(8);
    doc.text('Generado por gestión de pedidos', 14, 287);
    
    return {
        doc,
        lineas
    };
}

// Función para convertir ArrayBuffer a Base64 (igual que el frontend)
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function testFrontendFlow() {
    console.log('🚀 Iniciando simulación del flujo real del frontend...\n');
    
    try {
        // 1. Generar PDF (simulando jsPDF del frontend)
        console.log('📄 Generando PDF...');
        const { doc, lineas } = generatePDF();
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBase64String = arrayBufferToBase64(pdfArrayBuffer);
        
        console.log('✅ PDF generado:', {
            arrayBufferSize: pdfArrayBuffer.byteLength,
            base64Length: pdfBase64String.length,
            firstChars: pdfBase64String.substring(0, 50) + '...'
        });
        
        // 2. Preparar datos exactamente como el frontend
        const tiendaActual = { nombre: 'Tienda Test' };
        const requestData = {
            tienda: tiendaActual.nombre || '',
            fecha: new Date().toLocaleDateString(),
            lineas: lineas,
            pdfBase64: pdfBase64String // solo base64 puro
        };
        
        console.log('\n📤 Enviando datos al backend...');
        console.log('Datos enviados:', {
            tienda: requestData.tienda,
            fecha: requestData.fecha,
            lineasCount: requestData.lineas.length,
            pdfBase64Length: requestData.pdfBase64.length
        });
        
        // 3. Enviar al backend (simulando fetch del frontend)
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:10001';
        const response = await axios.post(`${apiUrl}/api/enviar-proveedor`, requestData, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        console.log('\n✅ Respuesta del backend:', response.data);
        console.log('✅ Status:', response.status);
        
        if (response.status === 200) {
            console.log('\n🎉 ¡ÉXITO! El flujo completo del frontend está funcionando correctamente');
            console.log('📧 El email debería haber sido enviado con Mailgun');
        }
        
    } catch (error) {
        console.error('\n❌ Error en el flujo del frontend:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
    }
}

// Ejecutar la prueba
testFrontendFlow();
