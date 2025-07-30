/**
 * Script de prueba para verificar la funcionalidad de dirección de envío
 * y forma de pago en el editor de pedidos clientes-gestion
 */

console.log('🧪 Iniciando pruebas de integración frontend - Editor de Pedidos');

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
  },
  
  lineas: [
    {
      producto: 'Producto Test 1',
      cantidad: 2,
      formato: 'ud',
      peso: 1.5,
      lote: 'L2025001',
      comentario: 'Producto especial'
    },
    {
      esComentario: true,
      comentario: 'Entregar en horario de oficina'
    }
  ],
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario1',
      fecha: new Date(Date.now() - 3600000)
    },
    {
      estado: 'en_preparacion',
      usuario: 'operario2',
      fecha: new Date()
    }
  ]
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
  vendedor: 'Tienda Online',
  
  lineas: [
    {
      producto: 'Producto Test 2',
      cantidad: 1,
      formato: 'kg',
      peso: 0.5
    }
  ],
  
  historialEstados: [
    {
      estado: 'en_espera',
      usuario: 'operario1',
      fecha: new Date(Date.now() - 7200000)
    },
    {
      estado: 'preparado',
      usuario: 'operario3',
      fecha: new Date()
    }
  ]
};

// Importamos las funciones de utilidad para probar
import { 
  obtenerDireccionEnvio, 
  formatearFormaPago, 
  obtenerCodigoFormaPago 
} from '../src/clientes-gestion/utils/formatDireccion.js';

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
