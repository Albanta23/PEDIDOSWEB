const axios = require('axios');

const API_BASE_URL = 'http://localhost:10001';

async function testCompleteFlow() {
    console.log('🧪 INICIANDO PRUEBAS DEL FLUJO COMPLETO');
    console.log('==========================================');
    
    try {
        // 1. Prueba de conectividad
        console.log('\n1️⃣ Probando conectividad del backend...');
        const testResponse = await axios.get(`${API_BASE_URL}/api/test`);
        console.log('✅ Backend conectado:', testResponse.data);
        
        // 2. Generar datos de prueba realistas
        console.log('\n2️⃣ Preparando datos de prueba realistas...');
        const testPedido = {
            tienda: 'Carnicería Ballesteros - Sucursal Centro',
            fechaPedido: new Date().toISOString(),
            proveedor: {
                email: 'javier.cantoral.fernandez@gmail.com',
                nombre: 'Proveedor Cárnico Profesional'
            },
            productos: [
                { nombre: 'Lomo Ibérico Extra', cantidad: 5, peso: '2.5kg', precio: 18.50 },
                { nombre: 'Chorizo Tradicional Premium', cantidad: 8, peso: '1.2kg', precio: 12.75 },
                { nombre: 'Jamón Serrano Reserva', cantidad: 3, peso: '1.8kg', precio: 28.00 },
                { nombre: 'Morcilla de Burgos', cantidad: 6, peso: '800g', precio: 9.50 }
            ],
            observaciones: 'Pedido urgente para el fin de semana. Confirmar disponibilidad de productos premium. Entrega preferible antes de las 10:00h.'
        };
        
        console.log('📦 Pedido preparado con', testPedido.productos.length, 'productos');
        
        // 3. Envío del email (usando endpoint de producción anti-spam)
        console.log('\n3️⃣ Enviando email de producción (anti-spam)...');
        const emailResponse = await axios.post(`${API_BASE_URL}/api/enviar-proveedor-production`, testPedido, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Email enviado exitosamente!');
        console.log('📧 Respuesta del servidor:', emailResponse.data);
        
        console.log('\n🎉 TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
        console.log('==========================================');
        console.log('📋 Resumen:');
        console.log('   ✅ Backend funcionando en puerto 10001');
        console.log('   ✅ Mailgun configurado correctamente');
        console.log('   ✅ Email enviado al proveedor');
        console.log('   📩 Email destino:', testPedido.proveedor.email);
        console.log('\n💡 Revisa tu bandeja de entrada para confirmar la recepción del email.');
        console.log('⚠️  Si no recibes el email, verifica que el email esté autorizado en Mailgun Sandbox.');
        
    } catch (error) {
        console.error('\n❌ ERROR EN LAS PRUEBAS:');
        console.error('=========================');
        
        if (error.response) {
            console.error('📊 Status:', error.response.status);
            console.error('📄 Datos:', error.response.data);
            console.error('🔗 URL:', error.config?.url);
        } else if (error.request) {
            console.error('🌐 Error de red - No se pudo conectar al backend');
            console.error('🔗 URL intentada:', error.config?.url);
        } else {
            console.error('⚙️ Error de configuración:', error.message);
        }
        
        console.error('\n🔍 DIAGNÓSTICOS SUGERIDOS:');
        console.error('- Verifica que el backend esté ejecutándose en puerto 10001');
        console.error('- Confirma que las variables de entorno de Mailgun están configuradas');
        console.error('- Asegúrate de que el email destino esté autorizado en Mailgun Sandbox');
    }
}

// Ejecutar las pruebas
testCompleteFlow();
