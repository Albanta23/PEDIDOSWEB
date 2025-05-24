// Test específico del flujo UI con debugging detallado
const axios = require('axios');
const { jsPDF } = require('jspdf');

async function testUIFlow() {
    console.log('🔍 DEBUGGEANDO ERROR DE ENVÍO DESDE LA APP');
    console.log('============================================');
    
    try {
        // 1. Verificar conectividad básica
        console.log('\n1️⃣ Verificando conectividad...');
        const apiUrl = 'http://localhost:10001';
        const testResponse = await axios.get(`${apiUrl}/api/test`);
        console.log('✅ Backend OK:', testResponse.data);
        
        // 2. Simular datos exactos que envía la UI
        console.log('\n2️⃣ Preparando datos exactos de la UI...');
        const lineasProveedor = [
            { referencia: 'PROD001', cantidad: 5 },
            { referencia: 'PROD002', cantidad: 3 }
        ];
        const tiendaActual = { nombre: 'Tienda Test' };
        
        // Generar PDF real con jsPDF (igual que la app)
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        let y = 18;
        doc.setFontSize(15);
        doc.text('Pedidos a Proveedores', 105, y, { align: 'center' });
        y += 8;
        doc.setFontSize(10);
        doc.text(`Tienda: ${tiendaActual.nombre}`, 14, y);
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
        lineasProveedor.forEach(l => {
            doc.text(String(l.referencia), 14, y);
            doc.text(String(l.cantidad), 80, y);
            y += 5;
        });
        doc.setFontSize(8);
        doc.text('Generado por gestión de pedidos', 14, 287);
        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBase64String = Buffer.from(pdfArrayBuffer).toString('base64');
        
        const requestData = {
            tienda: tiendaActual.nombre || '',
            fecha: new Date().toLocaleDateString(),
            lineas: lineasProveedor,
            pdfBase64: pdfBase64String
        };
        
        console.log('📤 Datos preparados:', {
            tienda: requestData.tienda,
            fecha: requestData.fecha,
            lineasCount: requestData.lineas.length,
            pdfBase64Length: requestData.pdfBase64.length,
            endpoint: `${apiUrl}/api/enviar-proveedor`
        });
        
        // 3. Enviar con debugging detallado
        console.log('\n3️⃣ Enviando request...');
        
        const response = await axios.post(`${apiUrl}/api/enviar-proveedor`, requestData, {
            headers: { 
                'Content-Type': 'application/json',
                'User-Agent': 'Test-Frontend-UI'
            },
            timeout: 30000,
            validateStatus: () => true // No throw errors on HTTP status codes
        });
        
        console.log('\n📊 RESPUESTA COMPLETA:');
        console.log('Status:', response.status);
        console.log('Headers:', response.headers);
        console.log('Data:', response.data);
        
        if (response.status === 200) {
            console.log('\n✅ ¡ÉXITO! Email enviado correctamente');
        } else {
            console.log('\n❌ ERROR en el envío:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
        }
        
    } catch (error) {
        console.error('\n💥 EXCEPCIÓN CAPTURADA:');
        console.error('========================');
        
        if (error.response) {
            console.error('📊 Response Status:', error.response.status);
            console.error('📄 Response Data:', error.response.data);
            console.error('🔗 Request URL:', error.config?.url);
            console.error('📝 Request Data:', error.config?.data);
        } else if (error.request) {
            console.error('🌐 No response received');
            console.error('🔗 Request URL:', error.config?.url);
            console.error('⏱️ Timeout?', error.code === 'ECONNABORTED');
        } else {
            console.error('⚙️ Setup Error:', error.message);
        }
        
        console.error('\nStack trace:', error.stack);
    }
}

testUIFlow();
