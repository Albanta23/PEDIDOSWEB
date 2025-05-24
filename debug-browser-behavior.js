// Simulación exacta del comportamiento del navegador para debugging
const axios = require('axios');

async function debugBrowserBehavior() {
    console.log('🌐 DEBUGGING COMPORTAMIENTO DEL NAVEGADOR');
    console.log('=========================================');
    
    // 1. Verificar variables de entorno como las ve el frontend
    console.log('\n1️⃣ Variables de entorno del frontend:');
    const apiUrl = process.env.VITE_API_URL || 'http://localhost:10001';
    console.log('VITE_API_URL:', process.env.VITE_API_URL);
    console.log('Resolved apiUrl:', apiUrl);
    console.log('Final endpoint:', `${apiUrl}/api/enviar-proveedor`);
    
    // 2. Verificar conectividad con headers de navegador
    console.log('\n2️⃣ Probando conectividad con headers de navegador...');
    try {
        const testResponse = await axios.get(`${apiUrl}/api/test`, {
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
                'Origin': 'http://localhost:3000',
                'Referer': 'http://localhost:3000/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
            }
        });
        console.log('✅ Test endpoint OK:', testResponse.data);
    } catch (error) {
        console.error('❌ Error en test endpoint:', error.message);
    }
    
    // 3. Simular datos exactos que genera jsPDF en el navegador
    console.log('\n3️⃣ Generando datos como lo haría el navegador...');
    
    // Simular el proceso de conversión de ArrayBuffer a Base64 como en el navegador
    function browserArrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return Buffer.from(binary, 'binary').toString('base64');
    }
    
    // Simular un PDF ArrayBuffer simple
    const samplePDFArrayBuffer = Buffer.from('%PDF-1.3\n%âãÏÓ\n3 0 obj\n<</Type /Page\n/Parent 1 0 R\n/MediaBox [0 0 595 842]\n/Resources 2 0 R\n>>\nendobj\n2 0 obj\n<</Font <</F1 3 0 R>>>>\nendobj\n3 0 obj\n<</Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n1 0 obj\n<</Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n4 0 obj\n<</Type /Catalog\n/Pages 1 0 R\n>>\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000313 00000 n \n0000000164 00000 n \n0000000220 00000 n \n0000000369 00000 n \ntrailer\n<</Size 5\n/Root 4 0 R\n>>\nstartxref\n418\n%%EOF', 'binary');
    
    const pdfBase64String = browserArrayBufferToBase64(samplePDFArrayBuffer);
    
    const requestData = {
        tienda: 'Tienda Test',
        fecha: new Date().toLocaleDateString(),
        lineas: [
            { referencia: 'PROD001', cantidad: 5 },
            { referencia: 'PROD002', cantidad: 3 }
        ],
        pdfBase64: pdfBase64String
    };
    
    console.log('📄 Datos preparados:', {
        tienda: requestData.tienda,
        fecha: requestData.fecha,
        lineasCount: requestData.lineas.length,
        pdfBase64Length: requestData.pdfBase64.length,
        pdfBase64Preview: requestData.pdfBase64.substring(0, 50) + '...'
    });
    
    // 4. Enviar con headers exactos del navegador
    console.log('\n4️⃣ Enviando con headers de navegador...');
    try {
        const response = await axios.post(`${apiUrl}/api/enviar-proveedor`, requestData, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
                'Origin': 'http://localhost:3000',
                'Referer': 'http://localhost:3000/',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
                'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Linux"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site'
            },
            timeout: 30000,
            validateStatus: () => true
        });
        
        console.log('\n📊 RESPUESTA:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('Data:', response.data);
        
        if (response.status === 200) {
            console.log('\n✅ ¡Email enviado exitosamente desde simulación de navegador!');
        } else {
            console.log('\n❌ Error en la respuesta:', response.data);
        }
        
    } catch (error) {
        console.error('\n💥 ERROR CAPTURADO:');
        console.error('==================');
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📊 Status Text:', error.response.statusText);
            console.error('📄 Data:', error.response.data);
            console.error('🔗 URL:', error.config.url);
        } else if (error.request) {
            console.error('🌐 Request hecho pero sin respuesta');
            console.error('🔗 URL:', error.config.url);
            console.error('⏱️ Timeout:', error.code === 'ECONNABORTED');
            console.error('🚫 Network Error:', error.code === 'ENOTFOUND');
        } else {
            console.error('⚙️ Error de setup:', error.message);
        }
    }
    
    // 5. Verificar estado del backend después del intento
    console.log('\n5️⃣ Verificando estado del backend después del intento...');
    try {
        const healthCheck = await axios.get(`${apiUrl}/api/test`);
        console.log('✅ Backend sigue funcionando:', healthCheck.data);
    } catch (error) {
        console.error('❌ Backend no responde después del intento:', error.message);
    }
}

debugBrowserBehavior();
