/**
 * Script para crear pedidos de prueba vía API REST
 */

const pedidoConEnvioAlternativo = {
  numeroPedido: 'TEST-2025-001',
  clienteNombre: 'Cliente Prueba Envío Alternativo',
  clienteNif: '12345678A',
  telefono: '911234567',
  direccion: 'Calle Facturación 123',
  codigoPostal: '28001',
  poblacion: 'Madrid',
  provincia: 'Madrid',
  estado: 'en_preparacion',
  fechaPedido: new Date().toISOString(),
  usuarioTramitando: 'operario_test',
  bultos: 2,
  
  // Datos de envío alternativo de WooCommerce (NUEVOS)
  datosEnvioWoo: {
    esEnvioAlternativo: true,
    nombre: 'María López Destinataria',
    empresa: 'Oficinas Centrales S.L.',
    direccion1: 'Avenida del Envío 456',
    direccion2: 'Oficina 301 - 3ª Planta',
    codigoPostal: '28080',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    telefono: '917654321',
    pais: 'ES'
  },
  
  // Datos de WooCommerce para forma de pago y vendedor (NUEVOS)
  datosWooCommerce: {
    formaPago: {
      titulo: 'Transferencia Bancaria',
      codigo: '01',
      metodo: 'bacs'
    },
    vendedor: 'Tienda Online'
  },
  
  // Forma de pago directa (compatibilidad)
  formaPago: 'Transferencia Bancaria',
  vendedor: 'Tienda Online',
  
  lineas: [
    {
      producto: 'Producto Test Envío Alternativo',
      cantidad: 2,
      formato: 'ud',
      peso: 1.5,
      lote: 'L2025001',
      comentario: 'Producto especial para prueba'
    },
    {
      esComentario: true,
      comentario: 'IMPORTANTE: Entregar en horario de oficina (9:00-17:00)'
    }
  ],
  
  esPrueba: true,
  descripcionPrueba: 'Pedido creado para probar direcciones de envío alternativas'
};

const pedidoNormal = {
  numeroPedido: 'TEST-2025-002',
  clienteNombre: 'Cliente Prueba Normal',
  clienteNif: '87654321B',
  telefono: '983111222',
  direccion: 'Plaza Mayor 1',
  codigoPostal: '47001',
  poblacion: 'Valladolid',
  provincia: 'Valladolid',
  estado: 'preparado',
  fechaPedido: new Date().toISOString(),
  usuarioTramitando: 'operario_test',
  bultos: 1,
  
  // Sin envío alternativo
  datosEnvioWoo: {
    esEnvioAlternativo: false
  },
  
  formaPago: 'Contra reembolso',
  vendedor: 'Mostrador',
  
  lineas: [
    {
      producto: 'Producto Test Normal',
      cantidad: 1,
      formato: 'kg',
      peso: 0.5
    }
  ],
  
  esPrueba: true,
  descripcionPrueba: 'Pedido normal para comparar'
};

async function crearPedidosViaAPI() {
  const baseUrl = 'http://localhost:3001'; // Puerto del backend
  
  try {
    console.log('📝 Creando pedidos de prueba vía API...');
    
    // Crear primer pedido
    console.log('📦 Creando pedido con envío alternativo...');
    const response1 = await fetch(`${baseUrl}/api/pedidos-clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedidoConEnvioAlternativo)
    });
    
    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ Pedido 1 creado:', result1._id);
    } else {
      console.log('❌ Error creando pedido 1:', response1.status, response1.statusText);
    }
    
    // Crear segundo pedido
    console.log('📦 Creando pedido normal...');
    const response2 = await fetch(`${baseUrl}/api/pedidos-clientes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedidoNormal)
    });
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Pedido 2 creado:', result2._id);
    } else {
      console.log('❌ Error creando pedido 2:', response2.status, response2.statusText);
    }
    
    console.log('');
    console.log('🌐 Ahora puedes ver los pedidos en:');
    console.log('   https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3100.app.github.dev/');
    console.log('');
    console.log('🔍 Busca los pedidos:');
    console.log('   - TEST-2025-001 (con envío alternativo)');
    console.log('   - TEST-2025-002 (normal)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

crearPedidosViaAPI();
