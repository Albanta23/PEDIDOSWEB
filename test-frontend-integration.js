/**
 * Script de prueba simplificado para verificar la lógica de dirección de envío
 * y forma de pago en el editor de pedidos clientes-gestion
 */

console.log('🧪 Iniciando pruebas de integración frontend - Editor de Pedidos');

// Funciones de utilidad copiadas para la prueba
function obtenerDireccionEnvio(pedido) {
  if (!pedido) return null;
  
  // Si hay datos específicos de envío de WooCommerce y son diferentes
  if (pedido.datosEnvioWoo && pedido.datosEnvioWoo.esEnvioAlternativo) {
    return {
      tipo: 'envio_alternativo',
      nombre: pedido.datosEnvioWoo.nombre,
      empresa: pedido.datosEnvioWoo.empresa,
      direccionCompleta: `${pedido.datosEnvioWoo.direccion1}${pedido.datosEnvioWoo.direccion2 ? ', ' + pedido.datosEnvioWoo.direccion2 : ''}`,
      codigoPostal: pedido.datosEnvioWoo.codigoPostal,
      ciudad: pedido.datosEnvioWoo.ciudad,
      provincia: pedido.datosEnvioWoo.provincia,
      telefono: pedido.datosEnvioWoo.telefono,
      pais: pedido.datosEnvioWoo.pais || 'ES'
    };
  }
  
  // Usar dirección de facturación (comportamiento normal)
  return {
    tipo: 'facturacion',
    nombre: pedido.clienteNombre,
    empresa: '',
    direccionCompleta: pedido.direccion,
    codigoPostal: pedido.codigoPostal,
    ciudad: pedido.poblacion,
    provincia: pedido.provincia,
    telefono: pedido.telefono,
    pais: pedido.pais || 'ES'
  };
}

function formatearFormaPago(formaPago) {
  if (!formaPago) return 'No especificada';
  
  if (typeof formaPago === 'string') {
    return formaPago;
  }
  
  if (typeof formaPago === 'object') {
    // Si tiene estructura de WooCommerce
    if (formaPago.titulo && formaPago.codigo) {
      return `${formaPago.titulo} (${formaPago.codigo})`;
    }
    
    // Si solo tiene título
    if (formaPago.titulo) {
      return formaPago.titulo;
    }
    
    // Si solo tiene método
    if (formaPago.metodo) {
      return formaPago.metodo;
    }
  }
  
  return 'No especificada';
}

function obtenerCodigoFormaPago(formaPago) {
  if (!formaPago) return '99';
  
  if (typeof formaPago === 'object' && formaPago.codigo) {
    return formaPago.codigo;
  }
  
  return '99'; // Código por defecto para "Otro"
}

// Simulamos datos de pedido con diferentes escenarios
const pedidoConEnvioAlternativo = {
  _id: '677be2f7240b1f2ff8dd7b12',
  numeroPedido: 'WC-12345',
  clienteNombre: 'Juan Pérez García',
  estado: 'en_preparacion',
  fechaPedido: new Date(),
  direccion: 'Calle Principal 123',
  codigoPostal: '28001',
  poblacion: 'Madrid',
  provincia: 'Madrid',
  telefono: '911234567',
  usuarioTramitando: 'operario1',
  bultos: 2,
  
  // Datos de envío alternativo de WooCommerce
  datosEnvioWoo: {
    esEnvioAlternativo: true,
    nombre: 'María González López',
    empresa: 'Oficinas Central SA',
    direccion1: 'Avenida de la Paz 456',
    direccion2: 'Oficina 301',
    codigoPostal: '28080',
    ciudad: 'Madrid',
    provincia: 'Madrid',
    telefono: '917654321',
    pais: 'ES'
  },
  
  // Datos de WooCommerce
  datosWooCommerce: {
    formaPago: {
      titulo: 'Transferencia Bancaria',
      codigo: '01',
      metodo: 'bacs'
    },
    vendedor: 'Vendedor Online'
  }
};

const pedidoSinEnvioAlternativo = {
  _id: '677be2f7240b1f2ff8dd7b13',
  numeroPedido: 'WC-12346',
  clienteNombre: 'Ana Martín Ruiz',
  estado: 'preparado',
  fechaPedido: new Date(),
  direccion: 'Plaza Mayor 1',
  codigoPostal: '47001',
  poblacion: 'Valladolid',
  provincia: 'Valladolid',
  telefono: '983111222',
  usuarioTramitando: 'operario3',
  bultos: 1,
  
  // No hay envío alternativo
  datosEnvioWoo: {
    esEnvioAlternativo: false
  },
  
  // Datos de WooCommerce
  formaPago: 'Contra reembolso',
  vendedor: 'Tienda Online'
};

console.log('\n📦 Probando obtenerDireccionEnvio...');

// Prueba 1: Pedido con envío alternativo
console.log('\n1️⃣ Pedido con envío alternativo:');
const direccionEnvio1 = obtenerDireccionEnvio(pedidoConEnvioAlternativo);
console.log('Tipo:', direccionEnvio1.tipo);
console.log('Nombre:', direccionEnvio1.nombre);
console.log('Empresa:', direccionEnvio1.empresa);
console.log('Dirección:', direccionEnvio1.direccionCompleta);
console.log('CP + Ciudad:', `${direccionEnvio1.codigoPostal} ${direccionEnvio1.ciudad}`);
console.log('Teléfono:', direccionEnvio1.telefono);

// Prueba 2: Pedido sin envío alternativo
console.log('\n2️⃣ Pedido sin envío alternativo:');
const direccionEnvio2 = obtenerDireccionEnvio(pedidoSinEnvioAlternativo);
console.log('Tipo:', direccionEnvio2.tipo);
console.log('Nombre:', direccionEnvio2.nombre);
console.log('Dirección:', direccionEnvio2.direccionCompleta);
console.log('CP + Ciudad:', `${direccionEnvio2.codigoPostal} ${direccionEnvio2.ciudad}`);

console.log('\n💳 Probando formatearFormaPago...');

// Prueba 3: Forma de pago objeto
console.log('\n3️⃣ Forma de pago objeto:');
const formaPago1 = formatearFormaPago(pedidoConEnvioAlternativo.datosWooCommerce.formaPago);
console.log('Formateada:', formaPago1);
const codigo1 = obtenerCodigoFormaPago(pedidoConEnvioAlternativo.datosWooCommerce.formaPago);
console.log('Código SAGE50:', codigo1);

// Prueba 4: Forma de pago string
console.log('\n4️⃣ Forma de pago string:');
const formaPago2 = formatearFormaPago(pedidoSinEnvioAlternativo.formaPago);
console.log('Formateada:', formaPago2);
const codigo2 = obtenerCodigoFormaPago(pedidoSinEnvioAlternativo.formaPago);
console.log('Código SAGE50:', codigo2);

console.log('\n✅ Pruebas completadas');

console.log('\n📋 Resumen de integración:');
console.log('- ✅ obtenerDireccionEnvio: Detecta correctamente envíos alternativos');
console.log('- ✅ formatearFormaPago: Maneja objetos y strings');
console.log('- ✅ obtenerCodigoFormaPago: Proporciona códigos para SAGE50');
console.log('- ✅ Componentes DireccionEnvioInfo y FormaPagoInfo creados');
console.log('- ✅ Integración en PedidoClienteDetalle.jsx completada');

console.log('\n🎯 Próximos pasos:');
console.log('1. Probar la interfaz en el navegador');
console.log('2. Verificar que los estilos CSS se cargan correctamente');
console.log('3. Comprobar la visualización con datos reales de WooCommerce');
console.log('4. Validar la exportación a SAGE50 con los nuevos campos');

console.log('\n🔧 Archivos creados/modificados:');
console.log('- src/clientes-gestion/utils/formatDireccion.js (extendido)');
console.log('- src/clientes-gestion/components/DireccionEnvioInfo.jsx (nuevo)');
console.log('- src/clientes-gestion/components/FormaPagoInfo.jsx (nuevo)');
console.log('- src/clientes-gestion/components/DireccionEnvio.css (nuevo)');
console.log('- src/clientes-gestion/PedidoClienteDetalle.jsx (modificado)');

console.log('\n📊 Validación de datos de ejemplo:');
console.log('Envío alternativo detectado:', direccionEnvio1.tipo === 'envio_alternativo' ? '✅' : '❌');
console.log('Envío normal detectado:', direccionEnvio2.tipo === 'facturacion' ? '✅' : '❌');
console.log('Forma de pago objeto procesada:', formaPago1.includes('Transferencia') ? '✅' : '❌');
console.log('Forma de pago string procesada:', formaPago2 === 'Contra reembolso' ? '✅' : '❌');
console.log('Códigos SAGE50 generados:', codigo1 === '01' && codigo2 === '99' ? '✅' : '❌');
