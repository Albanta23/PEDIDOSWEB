// Script para añadir al localStorage datos de prueba para el editor
// Ejecutar en la consola del navegador de clientes-gestion

const pedidoPruebaEnvioAlternativo = {
  _id: '677be2f7240b1f2ff8dd7b12',
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
  
  // ⭐ DATOS NUEVOS DE ENVÍO ALTERNATIVO
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
  
  // ⭐ DATOS NUEVOS DE FORMA DE PAGO
  datosWooCommerce: {
    formaPago: {
      titulo: 'Transferencia Bancaria',
      codigo: '01',
      metodo: 'bacs'
    },
    vendedor: 'Tienda Online'
  },
  
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
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario_test',
      fecha: new Date(Date.now() - 3600000).toISOString(),
      tipo: 'estado'
    },
    {
      estado: 'en_preparacion',
      usuario: 'operario_test',
      fecha: new Date().toISOString(),
      tipo: 'estado'
    }
  ]
};

const pedidoPruebaNormal = {
  _id: '677be2f7240b1f2ff8dd7b13',
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
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario_test',
      fecha: new Date(Date.now() - 7200000).toISOString(),
      tipo: 'estado'
    },
    {
      estado: 'preparado',
      usuario: 'operario_test',
      fecha: new Date().toISOString(),
      tipo: 'estado'
    }
  ]
};

// Guardar en localStorage para que la aplicación los muestre
localStorage.setItem('pedidos_prueba', JSON.stringify([
  pedidoPruebaEnvioAlternativo,
  pedidoPruebaNormal
]));

console.log('✅ Pedidos de prueba guardados en localStorage');
console.log('📋 Para ver las implementaciones:');
console.log('1. Ve a "Pedidos Clientes"');
console.log('2. Busca los pedidos TEST-2025-001 y TEST-2025-002');
console.log('3. Haz clic en "Ver detalle" en cualquiera de ellos');
console.log('');
console.log('🔍 Nuevas secciones que deberías ver:');
console.log('📦 Dirección de Envío (alternativa o a facturación)');
console.log('💳 Información de Pago (forma de pago y vendedor)');

// También simular la función para abrir el detalle
window.mostrarPedidoPrueba = function(tipo) {
  const pedido = tipo === 'alternativo' ? pedidoPruebaEnvioAlternativo : pedidoPruebaNormal;
  
  // Simular la función de abrir detalle que debe existir en el contexto de React
  if (window.abrirDetallePedido) {
    window.abrirDetallePedido(pedido);
  } else {
    console.log('📋 Datos del pedido para probar manualmente:');
    console.log(JSON.stringify(pedido, null, 2));
  }
};

console.log('🔧 Funciones disponibles:');
console.log('- mostrarPedidoPrueba("alternativo") - Muestra pedido con envío alternativo');
console.log('- mostrarPedidoPrueba("normal") - Muestra pedido normal');
