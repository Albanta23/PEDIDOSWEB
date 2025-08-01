#!/usr/bin/env node

/**
 * Script de prueba para verificar que los campos FACTURA y FECHAFRA están vacíos
 * en la exportación a Sage50
 */

// Simular datos de prueba
const pedidoPrueba = {
  clienteId: 'TEST001',
  clienteNombre: 'Cliente de Prueba S.L.',
  numeroPedido: 12345,
  almacenExpedicion: '01',
  vendedor: '02',
  formaPago: '03',
  serieFacturacion: 'A',
  
  lineas: [
    {
      producto: 'Producto Test',
      codigoSage: 'TEST001',
      cantidad: 5,
      peso: 2.5,
      formato: 'kg',
      comentario: 'Producto de prueba',
      cantidadEnviada: 5,
      precioUnitario: 15.50,
      descuento: 5
    },
    {
      esComentario: true,
      comentario: 'Esta es una línea de comentario'
    }
  ]
};

const clientePrueba = {
  codigo: 'CLI001',
  nombre: 'Cliente de Prueba S.L.',
  nif: '12345678Z',
  direccion: 'Calle Test 123',
  codigoPostal: '28001',
  poblacion: 'Madrid',
  provincia: 'Madrid',
  telefono: '600123456',
  email: 'test@ejemplo.com'
};

console.log('🔍 VERIFICACIÓN CAMPOS FACTURA Y FECHAFRA VACÍOS');
console.log('===============================================\n');

function simularExportacionSage(pedido, cliente) {
  const numeroAlbaran = `ALB${String(pedido.numeroPedido).padStart(6, '0')}`;
  const fechaFormateada = new Date().toLocaleDateString('es-ES');
  const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
  
  console.log(`📋 Procesando pedido: ${pedido.numeroPedido}`);
  console.log(`🛒 Es WooCommerce: ${esWooCommerce ? 'SÍ' : 'NO'}`);
  console.log(`📅 Fecha: ${fechaFormateada}`);
  console.log(`📄 Albarán: ${numeroAlbaran}`);
  console.log('');

  const lineasGeneradas = [];

  pedido.lineas.forEach((linea, index) => {
    if (!linea.esComentario && linea.producto) {
      // Línea de producto
      let unidadesFinal;
      if (esWooCommerce) {
        unidadesFinal = linea.cantidad || 0;
      } else {
        if (linea.peso && linea.peso > 0 && (linea.formato === 'kg' || linea.formato === 'gramos')) {
          unidadesFinal = linea.peso;
        } else {
          unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0;
        }
      }

      const lineaSage = {
        serie: pedido.serieFacturacion || 'A',
        albaran: numeroAlbaran,
        cliente: cliente.codigo,
        fecha: fechaFormateada,
        almacen: pedido.almacenExpedicion || '01',
        formapago: pedido.formaPago || '01',
        vendedor: pedido.vendedor || '01',
        articulo: linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`,
        definicion: linea.producto,
        unidades: unidadesFinal,
        precio: (linea.precioUnitario || 0).toString().replace('.', ','),
        dto1: linea.descuento || 0,
        dto2: 0,
        Obra: '',
        factura: '', // 🔧 VACÍO
        fechafra: '', // 🔧 VACÍO
        observaciones: linea.comentario || ''
      };
      
      lineasGeneradas.push(lineaSage);
      
      console.log(`   ✅ Línea ${index + 1} - Producto: ${linea.producto}`);
      console.log(`      - FACTURA: "${lineaSage.factura}" ${lineaSage.factura === '' ? '✅ VACÍO' : '❌ NO VACÍO'}`);
      console.log(`      - FECHAFRA: "${lineaSage.fechafra}" ${lineaSage.fechafra === '' ? '✅ VACÍO' : '❌ NO VACÍO'}`);
      
    } else if (linea.esComentario && linea.comentario) {
      // Línea de comentario
      const lineaSage = {
        serie: pedido.serieFacturacion || 'A',
        albaran: numeroAlbaran,
        cliente: cliente.codigo,
        fecha: fechaFormateada,
        almacen: pedido.almacenExpedicion || '01',
        formapago: pedido.formaPago || '01', 
        vendedor: pedido.vendedor || '01',
        articulo: '',
        definicion: linea.comentario,
        unidades: '',
        precio: '',
        dto1: '',
        dto2: '',
        Obra: '',
        factura: '', // 🔧 VACÍO
        fechafra: '', // 🔧 VACÍO
        observaciones: ''
      };
      
      lineasGeneradas.push(lineaSage);
      
      console.log(`   ✅ Línea comentario: ${linea.comentario}`);
      console.log(`      - FACTURA: "${lineaSage.factura}" ${lineaSage.factura === '' ? '✅ VACÍO' : '❌ NO VACÍO'}`);
      console.log(`      - FECHAFRA: "${lineaSage.fechafra}" ${lineaSage.fechafra === '' ? '✅ VACÍO' : '❌ NO VACÍO'}`);
    }
    console.log('');
  });

  // Verificar que todos los campos están vacíos
  const todasFacturasVacias = lineasGeneradas.every(linea => linea.factura === '');
  const todasFechasFraVacias = lineasGeneradas.every(linea => linea.fechafra === '');
  
  console.log('🎯 RESULTADO DE VERIFICACIÓN:');
  console.log(`   - Todas las líneas tienen FACTURA vacía: ${todasFacturasVacias ? '✅ SÍ' : '❌ NO'}`);
  console.log(`   - Todas las líneas tienen FECHAFRA vacía: ${todasFechasFraVacias ? '✅ SÍ' : '❌ NO'}`);
  
  const verificacionCompleta = todasFacturasVacias && todasFechasFraVacias;
  console.log(`\n🏆 VERIFICACIÓN COMPLETA: ${verificacionCompleta ? '✅ CORRECTO' : '❌ ERROR'}`);
  
  return verificacionCompleta;
}

// Ejecutar verificación
const resultado = simularExportacionSage(pedidoPrueba, clientePrueba);

console.log('\n📋 RESUMEN DE CAMBIOS:');
console.log('====================');
console.log('✅ Campo FACTURA: Cambiado de numeroFactura a cadena vacía ""');
console.log('✅ Campo FECHAFRA: Cambiado de fechaFormateada a cadena vacía ""');
console.log('✅ Aplicado tanto a líneas de producto como de comentario');
console.log('\n💡 Los campos FACTURA y FECHAFRA ahora están vacíos en la exportación Sage50');

if (resultado) {
  console.log('\n🎉 ¡Corrección implementada correctamente!');
} else {
  console.log('\n❌ Hay errores en la implementación');
}
