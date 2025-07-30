/**
 * Script para crear un pedido de prueba con dirección de envío alternativa
 * y forma de pago para probar la implementación en el frontend
 */

const mongoose = require('mongoose');

// Esquema básico del pedido para la prueba
const pedidoPrueba = {
  numeroPedido: 'TEST-2025-001',
  clienteNombre: 'Cliente Prueba Envío Alternativo',
  clienteNif: '12345678A',
  telefono: '911234567',
  direccion: 'Calle Facturación 123',
  codigoPostal: '28001',
  poblacion: 'Madrid',
  provincia: 'Madrid',
  estado: 'en_preparacion',
  fechaPedido: new Date(),
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
    },
    {
      producto: 'Segundo Producto Test',
      cantidad: 1,
      formato: 'kg',
      peso: 0.8,
      lote: 'L2025002'
    }
  ],
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario_test',
      fecha: new Date(Date.now() - 3600000), // Hace 1 hora
      tipo: 'estado'
    },
    {
      estado: 'en_preparacion',
      usuario: 'operario_test',
      fecha: new Date(),
      tipo: 'estado'
    }
  ],
  
  // Metadatos para identificar como pedido de prueba
  esPrueba: true,
  fechaCreacion: new Date(),
  descripcionPrueba: 'Pedido creado para probar direcciones de envío alternativas y forma de pago'
};

// También crear un pedido sin envío alternativo para comparar
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
  fechaPedido: new Date(),
  usuarioTramitando: 'operario_test',
  bultos: 1,
  
  // Sin envío alternativo
  datosEnvioWoo: {
    esEnvioAlternativo: false
  },
  
  // Forma de pago simple
  formaPago: 'Contra reembolso',
  vendedor: 'Mostrador',
  
  lineas: [
    {
      producto: 'Producto Test Normal',
      cantidad: 1,
      formato: 'kg',
      peso: 0.5,
      comentario: 'Producto estándar'
    }
  ],
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario_test',
      fecha: new Date(Date.now() - 7200000), // Hace 2 horas
      tipo: 'estado'
    },
    {
      estado: 'preparado',
      usuario: 'operario_test',
      fecha: new Date(),
      tipo: 'estado'
    }
  ],
  
  esPrueba: true,
  fechaCreacion: new Date(),
  descripcionPrueba: 'Pedido normal para comparar con envío alternativo'
};

console.log('📝 Creando pedidos de prueba...');
console.log('');
console.log('🎯 Pedido 1: Con dirección de envío alternativa');
console.log('   - Dirección facturación:', pedidoPrueba.direccion);
console.log('   - Dirección envío:', pedidoPrueba.datosEnvioWoo.direccion1 + ', ' + pedidoPrueba.datosEnvioWoo.direccion2);
console.log('   - Forma de pago:', pedidoPrueba.datosWooCommerce.formaPago.titulo);
console.log('   - Vendedor:', pedidoPrueba.datosWooCommerce.vendedor);
console.log('');
console.log('🎯 Pedido 2: Dirección normal');
console.log('   - Dirección:', pedidoNormal.direccion);
console.log('   - Forma de pago:', pedidoNormal.formaPago);
console.log('   - Vendedor:', pedidoNormal.vendedor);

// Función para conectar y crear los pedidos
async function crearPedidosPrueba() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/carniceria');
    console.log('✅ Conectado a MongoDB');
    
    // Esquema dinámico para insertar
    const PedidoCliente = mongoose.model('PedidoCliente', new mongoose.Schema({}, { strict: false }));
    
    // Limpiar pedidos de prueba anteriores
    await PedidoCliente.deleteMany({ esPrueba: true });
    console.log('🧹 Limpiados pedidos de prueba anteriores');
    
    // Crear los nuevos pedidos
    const pedido1 = await PedidoCliente.create(pedidoPrueba);
    const pedido2 = await PedidoCliente.create(pedidoNormal);
    
    console.log('');
    console.log('✅ Pedidos creados exitosamente:');
    console.log('   📦 Pedido 1 ID:', pedido1._id);
    console.log('   📦 Pedido 2 ID:', pedido2._id);
    console.log('');
    console.log('🌐 Ahora puedes:');
    console.log('   1. Ir a clientes-gestion en el navegador');
    console.log('   2. Navegar a "Pedidos Clientes"');
    console.log('   3. Buscar los pedidos TEST-2025-001 y TEST-2025-002');
    console.log('   4. Hacer clic en "Ver detalle" para ver las nuevas implementaciones');
    console.log('');
    console.log('🔍 Lo que deberías ver:');
    console.log('   ⚠️  Sección "Envío Alternativo" en el pedido TEST-2025-001');
    console.log('   💳 Sección "Información de Pago" con forma de pago y vendedor');
    console.log('   ℹ️  Sección "Envío a Facturación" en el pedido TEST-2025-002');
    
    await mongoose.connection.close();
    console.log('📚 Conexión cerrada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  crearPedidosPrueba();
}

module.exports = { crearPedidosPrueba, pedidoPrueba, pedidoNormal };
