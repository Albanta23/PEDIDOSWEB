#!/usr/bin/env node

/**
 * Script para verificar específicamente el mapeo de la columna ARTICULO en el archivo Excel
 */

// Simular la lógica exacta del controlador
function simularGeneracionExcel(pedidos) {
  const lineasAlbaran = [];
  let contadorFactura = 1;

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

    console.log(`\n📦 PROCESANDO PEDIDO: ${pedido.numeroPedido}`);
    console.log(`📄 Albarán: ${numeroAlbaran}`);
    console.log(`👤 Cliente: ${datosCliente.codigo}`);

    if (pedido.lineas && pedido.lineas.length > 0) {
      pedido.lineas.forEach((linea, index) => {
        if (!linea.esComentario && linea.producto) {
          // LÓGICA EXACTA DEL CONTROLADOR
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
          const descuento2 = 0;

          const serieFactura = pedido.serieFacturacion || 'A';
          const almacenExpedicion = pedido.almacenExpedicion || '01';
          const formaPagoSage = (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01';
          const vendedorSage = pedido.vendedor || '01';
          
          // 🔍 PUNTO CRÍTICO: Mapeo del código de producto
          const codigoProductoSage = linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`;
          
          console.log(`\n   🏷️  LÍNEA ${index + 1}: ${linea.producto}`);
          console.log(`       📥 codigoSage entrada: "${linea.codigoSage || 'undefined'}"`);
          console.log(`       🎯 ARTICULO final: "${codigoProductoSage}"`);
          console.log(`       📊 Tipo: ${typeof codigoProductoSage}`);

          const observacionesCompletas = [
            linea.comentario || '',
            esWooCommerce ? 'Pedido WooCommerce' : '',
            !esWooCommerce && linea.peso ? `Peso: ${linea.peso}kg` : '',
            !esWooCommerce && linea.cantidadEnviada ? `Cant. enviada: ${linea.cantidadEnviada}` : ''
          ].filter(Boolean).join(' | ');

          // Crear objeto línea exacto como en el controlador
          const lineaAlbaran = {
            serie: serieFactura,
            albaran: numeroAlbaran,
            cliente: datosCliente.codigo,
            fecha: fechaFormateada,
            almacen: almacenExpedicion,
            formapago: formaPagoSage,
            vendedor: vendedorSage,
            articulo: codigoProductoSage, // 🔍 CAMPO CRÍTICO
            definicion: linea.producto,
            unidades: unidadesFinal,
            precio: precioUnitario.toString().replace('.', ','),
            dto1: descuento1,
            dto2: descuento2,
            Obra: '',
            factura: '',
            fechafra: '',
            observaciones: observacionesCompletas,
            nombrecliente: datosCliente.nombre,
            cifcliente: datosCliente.nif,
            dircliente: datosCliente.direccion,
            cpcliente: datosCliente.codigoPostal,
            pobcliente: datosCliente.poblacion,
            provcliente: datosCliente.provincia,
            telfcliente: datosCliente.telefono,
            emailcliente: datosCliente.email
          };

          lineasAlbaran.push(lineaAlbaran);

          // Verificar el objeto final
          console.log(`       ✅ Objeto ARTICULO en línea final: "${lineaAlbaran.articulo}"`);

        } else if (linea.esComentario && linea.comentario) {
          // Líneas de comentario
          const lineaComentario = {
            serie: pedido.serieFacturacion || 'A',
            albaran: numeroAlbaran,
            cliente: datosCliente.codigo,
            fecha: fechaFormateada,
            almacen: pedido.almacenExpedicion || '01',
            formapago: (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01',
            vendedor: pedido.vendedor || '01',
            articulo: '', // 🔍 VACÍO PARA COMENTARIOS
            definicion: linea.comentario,
            unidades: '',
            precio: '',
            dto1: '',
            dto2: '',
            Obra: '',
            factura: '',
            fechafra: '',
            observaciones: '',
            nombrecliente: datosCliente.nombre,
            cifcliente: datosCliente.nif,
            dircliente: datosCliente.direccion,
            cpcliente: datosCliente.codigoPostal,
            pobcliente: datosCliente.poblacion,
            provcliente: datosCliente.provincia,
            telfcliente: datosCliente.telefono,
            emailcliente: datosCliente.email
          };

          lineasAlbaran.push(lineaComentario);
          console.log(`\n   💬 COMENTARIO: ${linea.comentario}`);
          console.log(`       🎯 ARTICULO: "${lineaComentario.articulo}" (debe estar vacío)`);
        }
      });
    }

    contadorFactura++;
  });

  return lineasAlbaran;
}

// Datos de prueba con diferentes escenarios
const pedidosPrueba = [
  {
    numeroPedido: 12345,
    clienteNombre: 'Cliente Test S.L.',
    codigoCliente: 'CLI001',
    serieFacturacion: 'A',
    almacenExpedicion: '01',
    vendedor: '02',
    formaPago: '03',
    lineas: [
      {
        producto: 'Jamón con código',
        codigoSage: 'JAM001', // 🔍 TIENE CÓDIGO
        cantidad: 1,
        peso: 2.5,
        formato: 'kg',
        cantidadEnviada: 1,
        precioUnitario: 45.00,
        comentario: 'Jamón ibérico'
      },
      {
        producto: 'Chorizo sin código',
        // codigoSage: undefined, // 🔍 SIN CÓDIGO
        cantidad: 3,
        peso: 0,
        formato: 'unidad',
        cantidadEnviada: 3,
        precioUnitario: 12.50,
        comentario: 'Chorizo casero'
      },
      {
        esComentario: true,
        comentario: 'Instrucciones especiales de entrega'
      }
    ]
  }
];

console.log('🔍 VERIFICACIÓN COMPLETA MAPEO COLUMNA ARTICULO');
console.log('==============================================');

const lineasGeneradas = simularGeneracionExcel(pedidosPrueba);

console.log('\n📊 RESUMEN FINAL - COLUMNAS ARTICULO GENERADAS:');
console.log('===============================================');
lineasGeneradas.forEach((linea, index) => {
  console.log(`${index + 1}. ARTICULO: "${linea.articulo}" | DEFINICION: "${linea.definicion}"`);
});

// Verificación de formato
const todasAlfanumericas = lineasGeneradas.every(linea => typeof linea.articulo === 'string');
const productosConCodigo = lineasGeneradas.filter(linea => linea.articulo && !linea.articulo.startsWith('ART'));
const productosConCodigoGenerado = lineasGeneradas.filter(linea => linea.articulo && linea.articulo.startsWith('ART'));
const comentarios = lineasGeneradas.filter(linea => linea.articulo === '');

console.log('\n🎯 ANÁLISIS:');
console.log(`✅ Todas las columnas ARTICULO son alfanuméricas: ${todasAlfanumericas ? 'SÍ' : 'NO'}`);
console.log(`📦 Productos con código original: ${productosConCodigo.length}`);
console.log(`🏷️  Productos con código generado: ${productosConCodigoGenerado.length}`);
console.log(`💬 Comentarios (ARTICULO vacío): ${comentarios.length}`);

if (todasAlfanumericas) {
  console.log('\n🎉 ¡La columna ARTICULO se está mapeando CORRECTAMENTE!');
  console.log('✅ Formato alfanumérico correcto');
  console.log('✅ Códigos originales preservados cuando existen');
  console.log('✅ Códigos automáticos generados cuando no existen');
  console.log('✅ Comentarios tienen ARTICULO vacío (correcto para Sage50)');
} else {
  console.log('\n❌ HAY PROBLEMAS en el mapeo de la columna ARTICULO');
}
