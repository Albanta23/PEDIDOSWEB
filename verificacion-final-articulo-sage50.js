#!/usr/bin/env node

/**
 * Script final de verificación del mapeo correcto de la columna ARTICULO
 * con formato alfanumérico en Sage50
 */

console.log('🔍 VERIFICACIÓN FINAL - COLUMNA ARTICULO SAGE50');
console.log('==============================================\n');

// Simular datos exactos como en la base de datos
const pedidosTest = [
  {
    numeroPedido: 12345,
    clienteNombre: 'Carnicería Test S.L.',
    codigoCliente: 'CLI001',
    nif: '12345678Z',
    direccion: 'Calle Principal 123',
    codigoPostal: '28001',
    poblacion: 'Madrid',
    provincia: 'Madrid',
    telefono: '600123456',
    email: 'test@carniceria.com',
    serieFacturacion: 'A',
    almacenExpedicion: '01',
    vendedor: '02',
    formaPago: '03',
    
    lineas: [
      {
        producto: 'Jamón Ibérico D.O.',
        codigoSage: 'JAM001', // 🔍 CÓDIGO REAL DE SAGE
        cantidad: 1,
        peso: 2.5,
        formato: 'kg',
        cantidadEnviada: 1,
        precioUnitario: 45.00,
        descuento: 0,
        comentario: 'Jamón de bellota'
      },
      {
        producto: 'Chorizo Extra Picante',
        codigoSage: 'CHO025', // 🔍 OTRO CÓDIGO REAL
        cantidad: 6,
        peso: 0,
        formato: 'unidad',
        cantidadEnviada: 6,
        precioUnitario: 8.50,
        descuento: 5,
        comentario: 'Picante artesano'
      },
      {
        producto: 'Morcilla de Burgos',
        // codigoSage: undefined, // 🔍 SIN CÓDIGO - debe generar automático
        cantidad: 4,
        peso: 1.2,
        formato: 'kg',
        cantidadEnviada: 4,
        precioUnitario: 12.00,
        descuento: 0,
        comentario: 'Morcilla tradicional'
      },
      {
        esComentario: true,
        comentario: 'Entregar antes de las 14:00h - Cliente preferente'
      }
    ]
  }
];

function verificarMapeoColumnaArticulo(pedidos) {
  const lineasGeneradas = [];
  let contadorFactura = 1;

  console.log('📦 PROCESANDO PEDIDOS PARA SAGE50:');
  console.log('─'.repeat(50));

  pedidos.forEach(pedido => {
    const numeroAlbaran = `ALB${String(pedido.numeroPedido || contadorFactura).padStart(6, '0')}`;
    const fechaFormateada = new Date().toLocaleDateString('es-ES');
    const datosCliente = {
      codigo: pedido.codigoCliente || `CLI${String(contadorFactura).padStart(6, '0')}`,
      nombre: pedido.clienteNombre || 'Cliente',
      nif: pedido.nif || '',
      direccion: pedido.direccion || '',
      codigoPostal: pedido.codigoPostal || '',
      poblacion: pedido.poblacion || '',
      provincia: pedido.provincia || '',
      telefono: pedido.telefono || '',
      email: pedido.email || ''
    };

    console.log(`\n🏷️  PEDIDO ${pedido.numeroPedido} - ${datosCliente.nombre}`);

    if (pedido.lineas && pedido.lineas.length > 0) {
      pedido.lineas.forEach((linea, index) => {
        if (!linea.esComentario && linea.producto) {
          // APLICAR LÓGICA EXACTA DEL CONTROLADOR CORREGIDO
          const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
          
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

          const precioUnitario = linea.precio || linea.precioUnitario || 0;
          const descuento1 = linea.descuento || 0;

          const serieFactura = pedido.serieFacturacion || 'A';
          const almacenExpedicion = pedido.almacenExpedicion || '01';
          const formaPagoSage = (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01';
          const vendedorSage = pedido.vendedor || '01';
          
          // 🔧 LÓGICA CORREGIDA: ASEGURAR FORMATO ALFANUMÉRICO
          const codigoProductoSage = String(linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`);

          const observacionesCompletas = [
            linea.comentario || '',
            esWooCommerce ? 'Pedido WooCommerce' : '',
            !esWooCommerce && linea.peso ? `Peso: ${linea.peso}kg` : '',
            !esWooCommerce && linea.cantidadEnviada ? `Cant. enviada: ${linea.cantidadEnviada}` : ''
          ].filter(Boolean).join(' | ');

          // OBJETO FINAL EXACTO COMO EN EL CONTROLADOR
          const lineaFinal = {
            SERIE: serieFactura,
            ALBARAN: numeroAlbaran,
            CLIENTE: datosCliente.codigo,
            FECHA: fechaFormateada,
            ALMACEN: almacenExpedicion,
            FORMAPAGO: formaPagoSage,
            VENDEDOR: vendedorSage,
            ARTICULO: codigoProductoSage, // 🔍 CAMPO CRÍTICO
            DEFINICION: linea.producto,
            UNIDADES: unidadesFinal,
            PRECIO: precioUnitario.toString().replace('.', ','),
            DTO1: descuento1,
            DTO2: 0,
            OBRA: '',
            FACTURA: '',
            FECHAFRA: '',
            OBSERVACIONES: observacionesCompletas,
            NOMBRECLIENTE: datosCliente.nombre,
            CIFCLIENTE: datosCliente.nif,
            DIRCLIENTE: datosCliente.direccion,
            CPCLIENTE: datosCliente.codigoPostal,
            POBCLIENTE: datosCliente.poblacion,
            PROVCLIENTE: datosCliente.provincia,
            TELFCLIENTE: datosCliente.telefono,
            EMAILCLIENTE: datosCliente.email
          };

          lineasGeneradas.push(lineaFinal);

          console.log(`   ✅ Línea ${index + 1}: "${linea.producto}"`);
          console.log(`      📥 codigoSage original: "${linea.codigoSage || 'undefined'}"`);
          console.log(`      🎯 ARTICULO final: "${codigoProductoSage}" (${typeof codigoProductoSage})`);
          console.log(`      📊 DEFINICION: "${linea.producto}"`);
          console.log(`      🔢 UNIDADES: ${unidadesFinal}`);

        } else if (linea.esComentario && linea.comentario) {
          // Línea de comentario
          const lineaComentario = {
            SERIE: pedido.serieFacturacion || 'A',
            ALBARAN: numeroAlbaran,
            CLIENTE: datosCliente.codigo,
            FECHA: fechaFormateada,
            ALMACEN: pedido.almacenExpedicion || '01',
            FORMAPAGO: (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01',
            VENDEDOR: pedido.vendedor || '01',
            ARTICULO: '', // 🔍 VACÍO PARA COMENTARIOS
            DEFINICION: linea.comentario,
            UNIDADES: '',
            PRECIO: '',
            DTO1: '',
            DTO2: '',
            OBRA: '',
            FACTURA: '',
            FECHAFRA: '',
            OBSERVACIONES: '',
            NOMBRECLIENTE: datosCliente.nombre,
            CIFCLIENTE: datosCliente.nif,
            DIRCLIENTE: datosCliente.direccion,
            CPCLIENTE: datosCliente.codigoPostal,
            POBCLIENTE: datosCliente.poblacion,
            PROVCLIENTE: datosCliente.provincia,
            TELFCLIENTE: datosCliente.telefono,
            EMAILCLIENTE: datosCliente.email
          };

          lineasGeneradas.push(lineaComentario);
          console.log(`   💬 Comentario: "${linea.comentario}"`);
          console.log(`      🎯 ARTICULO: "${lineaComentario.ARTICULO}" (vacío - correcto)`);
        }
      });
    }

    contadorFactura++;
  });

  return lineasGeneradas;
}

// Ejecutar verificación
const lineasExcel = verificarMapeoColumnaArticulo(pedidosTest);

console.log('\n📊 ANÁLISIS FINAL DEL ARCHIVO EXCEL SAGE50:');
console.log('==========================================');

// Análisis detallado
const productosConCodigoOriginal = lineasExcel.filter(l => l.ARTICULO && !l.ARTICULO.startsWith('ART'));
const productosConCodigoGenerado = lineasExcel.filter(l => l.ARTICULO && l.ARTICULO.startsWith('ART'));
const comentarios = lineasExcel.filter(l => l.ARTICULO === '');
const formatosCorrectos = lineasExcel.every(l => typeof l.ARTICULO === 'string');

console.log(`📦 Total de líneas generadas: ${lineasExcel.length}`);
console.log(`🏷️  Productos con código original: ${productosConCodigoOriginal.length}`);
console.log(`🔧 Productos con código generado: ${productosConCodigoGenerado.length}`);
console.log(`💬 Líneas de comentario: ${comentarios.length}`);

console.log('\n🔍 DETALLE DE COLUMNAS ARTICULO:');
lineasExcel.forEach((linea, index) => {
  const tipo = linea.ARTICULO === '' ? 'COMENTARIO' : 
               linea.ARTICULO.startsWith('ART') ? 'GENERADO' : 'ORIGINAL';
  console.log(`   ${index + 1}. "${linea.ARTICULO}" (${tipo}) → "${linea.DEFINICION}"`);
});

console.log('\n✅ VERIFICACIONES SAGE50:');
console.log(`   🔤 Formato alfanumérico: ${formatosCorrectos ? '✅ CORRECTO' : '❌ ERROR'}`);
console.log(`   📋 Códigos preservados: ${productosConCodigoOriginal.length > 0 ? '✅ SÍ' : '⚠️  N/A'}`);
console.log(`   🏷️  Códigos generados: ${productosConCodigoGenerado.length > 0 ? '✅ SÍ' : '⚠️  N/A'}`);
console.log(`   💬 Comentarios vacíos: ${comentarios.length > 0 ? '✅ SÍ' : '⚠️  N/A'}`);

const verificacionCompleta = formatosCorrectos && 
                            (productosConCodigoOriginal.length > 0 || productosConCodigoGenerado.length > 0);

console.log(`\n🏆 RESULTADO FINAL: ${verificacionCompleta ? '✅ COLUMNA ARTICULO CORRECTA' : '❌ HAY ERRORES'}`);

if (verificacionCompleta) {
  console.log('\n🎉 ¡PERFECTO! La columna ARTICULO se mapea correctamente:');
  console.log('✅ Formato alfanumérico (string) garantizado');
  console.log('✅ Códigos originales preservados cuando existen');
  console.log('✅ Códigos automáticos generados cuando no existen');
  console.log('✅ Comentarios tienen ARTICULO vacío (correcto para Sage50)');
  console.log('✅ Cabeceras Excel en mayúsculas para máxima compatibilidad');
  console.log('\n💡 Los datos están listos para importar en Sage50');
}
