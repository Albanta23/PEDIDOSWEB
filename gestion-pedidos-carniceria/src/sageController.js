const PedidoCliente = require('./models/PedidoCliente');
const Cliente = require('./models/Cliente');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

/**
 * Función auxiliar para generar el nombre completo del cliente para SAGE50
 * @param {object} cliente - Objeto cliente con datos de nombre y apellidos
 * @param {string} fallbackNombre - Nombre de respaldo si no hay datos del cliente
 * @returns {string} - Nombre completo formateado para SAGE50
 */
function generarNombreCompletoSage(cliente, fallbackNombre = 'Cliente') {
  if (!cliente) {
    return fallbackNombre;
  }

  // Si hay razón social, se usa preferentemente
  if (cliente.razonSocial && cliente.razonSocial.trim()) {
    return cliente.razonSocial.trim();
  }

  // Construir nombre con apellidos separados si están disponibles
  if (cliente.nombre || cliente.primerApellido || cliente.segundoApellido) {
    const partesNombre = [
      cliente.nombre || '',
      cliente.primerApellido || '',
      cliente.segundoApellido || ''
    ].filter(parte => parte.trim().length > 0);
    
    if (partesNombre.length > 0) {
      return partesNombre.join(' ');
    }
  }

  // Fallback al nombre concatenado original o al nombre de respaldo
  return cliente.nombre || fallbackNombre;
}

/**
 * Exporta pedidos de clientes en formato SAGE50 - Albaranes de Venta
 * Estructura basada en el formato estándar de SAGE50 para importación de albaranes
 */
const exportarPedidos = async (req, res) => {
  try {
    console.log('[SAGE50] Iniciando exportación de pedidos para SAGE50 - Formato Albaranes de Venta');
    
    const { pedidoIds = [] } = req.body;
    
    // Filtro para obtener pedidos específicos o todos los pendientes
    const filtro = pedidoIds.length > 0 
      ? { _id: { $in: pedidoIds } }
      : { estado: { $in: ['preparado', 'enviado', 'listo'] } };

    const pedidos = await PedidoCliente.find(filtro)
      .populate('clienteId')
      .lean();

    console.log(`[SAGE50] Encontrados ${pedidos.length} pedidos para exportar.`);

    if (pedidos.length === 0) {
      return res.status(200).json({ message: "No hay pedidos para exportar." });
    }

    // Generar líneas del albarán según formato SAGE50
    const lineasAlbaran = [];
    let contadorFactura = 1;

    for (const pedido of pedidos) {
      // Obtener datos del cliente si no están en el pedido
      let datosCliente = {};
      if (pedido.clienteId) {
        try {
          const cliente = await Cliente.findById(pedido.clienteId);
          if (cliente) {
            datosCliente = {
              codigo: cliente.codigo || cliente.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
              nombre: generarNombreCompletoSage(cliente, pedido.clienteNombre),
              nif: cliente.nif || pedido.nif || '',
              direccion: cliente.direccion || pedido.direccion || '',
              codigoPostal: cliente.codigoPostal || pedido.codigoPostal || '',
              poblacion: cliente.poblacion || pedido.poblacion || '',
              provincia: cliente.provincia || pedido.provincia || '',
              telefono: cliente.telefono || pedido.telefono || '',
              email: cliente.email || pedido.email || ''
            };
          }
        } catch (error) {
          console.warn(`[SAGE50] No se pudo obtener datos del cliente ${pedido.clienteId}`);
        }
      }

      // Si no hay datos del cliente, usar los del pedido
      if (!datosCliente.codigo) {
        datosCliente = {
          codigo: pedido.codigoCliente || pedido.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
          nombre: pedido.clienteNombre || 'Cliente',
          nif: pedido.nif || '',
          direccion: pedido.direccion || '',
          codigoPostal: pedido.codigoPostal || '',
          poblacion: pedido.poblacion || '',
          provincia: pedido.provincia || '',
          telefono: pedido.telefono || '',
          email: pedido.email || ''
        };
      }

      const fechaAlbaran = pedido.fechaEnvio || pedido.fechaPedido || new Date();
      const fechaFormateada = new Date(fechaAlbaran).toLocaleDateString('es-ES');
      const numeroAlbaran = `ALB${String(pedido.numeroPedido || contadorFactura).padStart(6, '0')}`;
      const numeroFactura = `FR${String(contadorFactura).padStart(6, '0')}`;

      // Procesar líneas del pedido
      if (pedido.lineas && pedido.lineas.length > 0) {
        pedido.lineas.forEach((linea, index) => {
          if (!linea.esComentario && linea.producto) {
            // Línea de producto
            
            // 🔧 LÓGICA SIMPLIFICADA PARA UNIDADES SEGÚN PESO
            let unidadesFinal;
            const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
            
            if (esWooCommerce) {
              // 🛒 PEDIDOS WOOCOMMERCE: Siempre usar cantidad original (venta por unidad)
              unidadesFinal = linea.cantidad || 0;
            } else {
              // 🏪 PEDIDOS NORMALES: Lógica basada en el valor del peso
              // SI peso > 0 → usar PESO para UNIDADES
              // SI peso = 0 → usar CANTIDAD ENVIADA para UNIDADES
              if (linea.peso && linea.peso > 0) {
                unidadesFinal = linea.peso; // 🔧 PESO > 0: Usar peso
              } else {
                unidadesFinal = linea.cantidadEnviada || linea.cantidad || 0; // 🔧 PESO = 0: Usar cantidad enviada
              }
            }
            
            const precioUnitario = linea.precio || linea.precioUnitario || 0;
            const descuento1 = linea.descuento || 0; // Usar descuento de la línea
            const descuento2 = 0;

            // 🆕 MAPEO CORRECTO DE CAMPOS DESDE EL PEDIDO
            const serieFactura = pedido.serieFacturacion || 'A'; // Serie desde el pedido
            const almacenExpedicion = pedido.almacenExpedicion || '01'; // Almacén desde el pedido (CÓDIGO)
            const formaPagoSage = (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01'; // Forma de pago desde el pedido (CÓDIGO)
            const vendedorSage = pedido.vendedor || '01'; // Vendedor desde el pedido (CÓDIGO)
            const codigoProductoSage = String(linea.codigo || `ART${String(index + 1).padStart(5, '0')}`); // 🔧 USAR CAMPO 'codigo' PARA SAGE50
            
            // 🆕 OBSERVACIONES CON INFORMACIÓN CONTEXTUAL
            const observacionesCompletas = [
              linea.comentario || '',
              esWooCommerce ? 'Pedido WooCommerce' : '',
              !esWooCommerce && linea.peso ? `Peso: ${linea.peso}kg` : '',
              !esWooCommerce && linea.cantidadEnviada ? `Cant. enviada: ${linea.cantidadEnviada}` : ''
            ].filter(Boolean).join(' | ');

            lineasAlbaran.push({
              SERIE: serieFactura, // 🔧 CABECERAS MAYÚSCULAS PARA CLARIDAD
              ALBARAN: numeroAlbaran,
              CLIENTE: datosCliente.codigo,
              FECHA: fechaFormateada,
              ALMACEN: almacenExpedicion, // 🆕 USAR ALMACÉN DEL PEDIDO
              FORMAPAGO: formaPagoSage, // 🆕 USAR FORMA DE PAGO DEL PEDIDO
              VENDEDOR: vendedorSage, // 🆕 USAR VENDEDOR DEL PEDIDO
              ARTICULO: codigoProductoSage, // 🔧 CÓDIGO DE PRODUCTO ALFANUMÉRICO
              DEFINICION: linea.producto,
              UNIDADES: unidadesFinal,
              PRECIO: precioUnitario.toString().replace('.', ','), // SAGE50 usa coma decimal
              DTO1: descuento1,
              DTO2: descuento2,
              OBRA: '', // Campo obra vacío
              FACTURA: '', // 🔧 Campo factura vacío (según especificación)
              FECHAFRA: '', // 🔧 Campo fecha factura vacío (según especificación)
              OBSERVACIONES: observacionesCompletas,
              NOMBRECLIENTE: datosCliente.nombre,
              CIFCLIENTE: datosCliente.nif,
              DIRCLIENTE: datosCliente.direccion,
              CPCLIENTE: datosCliente.codigoPostal,
              POBCLIENTE: datosCliente.poblacion,
              PROVCLIENTE: datosCliente.provincia,
              TELFCLIENTE: datosCliente.telefono,
              EMAILCLIENTE: datosCliente.email
            });
            
            // 🔧 LOG DE DEBUG PARA VERIFICAR MAPEO
            console.log(`[SAGE50] Línea ${index + 1}: ARTICULO="${codigoProductoSage}" (${typeof codigoProductoSage}), DEFINICION="${linea.producto}"`);
          } else if (linea.esComentario && linea.comentario) {
            // Línea de comentario/observación
            // 🆕 MAPEO CORRECTO DE CAMPOS DESDE EL PEDIDO PARA COMENTARIOS
            const serieFactura = pedido.serieFacturacion || 'A';
            const almacenExpedicion = pedido.almacenExpedicion || '01'; // CÓDIGO del almacén
            const formaPagoSage = (typeof pedido.formaPago === 'object' ? pedido.formaPago.codigo : pedido.formaPago) || '01'; // CÓDIGO de forma de pago
            const vendedorSage = pedido.vendedor || '01'; // CÓDIGO del vendedor

            lineasAlbaran.push({
              SERIE: serieFactura, // 🔧 CABECERAS MAYÚSCULAS PARA CLARIDAD
              ALBARAN: numeroAlbaran,
              CLIENTE: datosCliente.codigo,
              FECHA: fechaFormateada,
              ALMACEN: almacenExpedicion, // 🆕 USAR ALMACÉN DEL PEDIDO
              FORMAPAGO: formaPagoSage, // 🆕 USAR FORMA DE PAGO DEL PEDIDO
              VENDEDOR: vendedorSage, // 🆕 USAR VENDEDOR DEL PEDIDO
              ARTICULO: '', // 🔧 Artículo vacío para comentarios (formato alfanumérico)
              DEFINICION: linea.comentario,
              UNIDADES: '',
              PRECIO: '',
              DTO1: '',
              DTO2: '',
              OBRA: '',
              FACTURA: '', // 🔧 Campo factura vacío (según especificación)
              FECHAFRA: '', // 🔧 Campo fecha factura vacío (según especificación)
              OBSERVACIONES: '',
              NOMBRECLIENTE: datosCliente.nombre,
              CIFCLIENTE: datosCliente.nif,
              DIRCLIENTE: datosCliente.direccion,
              CPCLIENTE: datosCliente.codigoPostal,
              POBCLIENTE: datosCliente.poblacion,
              PROVCLIENTE: datosCliente.provincia,
              TELFCLIENTE: datosCliente.telefono,
              EMAILCLIENTE: datosCliente.email
            });
            
            // 🔧 LOG DE DEBUG PARA COMENTARIOS
            console.log(`[SAGE50] Comentario: ARTICULO="" (vacío), DEFINICION="${linea.comentario}"`);
          }
        });
      }

      contadorFactura++;
    }

    if (lineasAlbaran.length === 0) {
      return res.status(200).json({ message: "No hay líneas de productos para exportar." });
    }

    // Generar archivo Excel compatible con SAGE50
    const workbook = XLSX.utils.book_new();
    
    // 🔧 USAR CABECERAS EXPLÍCITAS EN MAYÚSCULAS PARA SAGE50
    const worksheet = XLSX.utils.json_to_sheet(lineasAlbaran, {
      header: [
        'SERIE', 'ALBARAN', 'CLIENTE', 'FECHA', 'ALMACEN', 'FORMAPAGO', 'VENDEDOR',
        'ARTICULO', 'DEFINICION', 'UNIDADES', 'PRECIO', 'DTO1', 'DTO2', 'OBRA',
        'FACTURA', 'FECHAFRA', 'OBSERVACIONES', 'NOMBRECLIENTE', 'CIFCLIENTE',
        'DIRCLIENTE', 'CPCLIENTE', 'POBCLIENTE', 'PROVCLIENTE', 'TELFCLIENTE', 'EMAILCLIENTE'
      ]
    });
    
    // 🔧 LOG DE DEBUG PARA VERIFICAR DATOS GENERADOS
    console.log(`[SAGE50] DEBUG: Generadas ${lineasAlbaran.length} líneas de albarán`);
    if (lineasAlbaran.length > 0) {
      const primeraLinea = lineasAlbaran[0];
      console.log(`[SAGE50] DEBUG: Primera línea ARTICULO="${primeraLinea.ARTICULO}", DEFINICION="${primeraLinea.DEFINICION}"`);
    }

    // Configurar ancho de columnas para mejor legibilidad
    const columnWidths = [
      { wch: 8 },  // serie
      { wch: 12 }, // albaran
      { wch: 12 }, // cliente
      { wch: 12 }, // fecha
      { wch: 8 },  // almacen
      { wch: 10 }, // formapago
      { wch: 10 }, // vendedor
      { wch: 12 }, // articulo
      { wch: 30 }, // definicion
      { wch: 10 }, // unidades
      { wch: 10 }, // precio
      { wch: 8 },  // dto1
      { wch: 8 },  // dto2
      { wch: 10 }, // Obra
      { wch: 12 }, // factura
      { wch: 12 }, // fechafra
      { wch: 30 }, // observaciones
      { wch: 25 }, // nombrecliente
      { wch: 12 }, // cifcliente
      { wch: 30 }, // dircliente
      { wch: 8 },  // cpcliente
      { wch: 20 }, // pobcliente
      { wch: 15 }, // provcliente
      { wch: 12 }, // telfcliente
      { wch: 25 }  // emailcliente
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Albaranes_SAGE50');

    // Generar buffer del archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para descarga
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Exportacion_SAGE50_Albaranes_${fecha}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    console.log(`[SAGE50] Exportación completada: ${lineasAlbaran.length} líneas en ${pedidos.length} pedidos`);
    
    // Marcar pedidos como exportados a SAGE50
    const idsParaMarcar = pedidos.map(p => p._id);
    await PedidoCliente.updateMany(
      { _id: { $in: idsParaMarcar } },
      { 
        exportadoSage: true,
        fechaExportacionSage: new Date()
      }
    );
    
    console.log(`[SAGE50] Marcados ${idsParaMarcar.length} pedidos como exportados a SAGE50`);
    
    res.send(excelBuffer);

  } catch (error) {
    console.error('[SAGE50] Error al exportar pedidos:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al exportar para SAGE50.',
      details: error.message 
    });
  }
};

/**
 * Exporta pedidos en formato CSV para SAGE50
 */
const exportarPedidosCSV = async (req, res) => {
  try {
    console.log('[SAGE50] Iniciando exportación CSV para SAGE50');
    
    const { pedidoIds = [] } = req.body;
    
    const filtro = pedidoIds.length > 0 
      ? { _id: { $in: pedidoIds } }
      : { estado: { $in: ['preparado', 'enviado', 'listo'] } };

    const pedidos = await PedidoCliente.find(filtro)
      .populate('clienteId')
      .lean();

    if (pedidos.length === 0) {
      return res.status(200).json({ message: "No hay pedidos para exportar." });
    }

    // Reutilizar la lógica de generación de líneas
    const lineasAlbaran = await generarLineasAlbaran(pedidos);

    // Configurar parser CSV con separador de punto y coma (;) para SAGE50
    const camposCsv = [
      'serie', 'albaran', 'cliente', 'fecha', 'almacen', 'formapago', 'vendedor',
      'articulo', 'definicion', 'unidades', 'precio', 'dto1', 'dto2', 'Obra',
      'factura', 'fechafra', 'observaciones', 'nombrecliente', 'cifcliente',
      'dircliente', 'cpcliente', 'pobcliente', 'provcliente', 'telfcliente', 'emailcliente'
    ];
    
    const json2csvParser = new Parser({ 
      fields: camposCsv,
      delimiter: ';', // SAGE50 utiliza punto y coma como separador
      quote: '"'
    });
    
    const csv = json2csvParser.parse(lineasAlbaran);

    // Configurar headers para descarga CSV
    const fecha = new Date().toISOString().split('T')[0];
    const nombreArchivo = `Exportacion_SAGE50_Albaranes_${fecha}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    // Agregar BOM para UTF-8 (importante para caracteres especiales en SAGE50)
    const bom = '\uFEFF';
    
    // Marcar pedidos como exportados a SAGE50
    const idsParaMarcarCsv = pedidos.map(p => p._id);
    await PedidoCliente.updateMany(
      { _id: { $in: idsParaMarcarCsv } },
      { 
        exportadoSage: true,
        fechaExportacionSage: new Date()
      }
    );
    
    console.log(`[SAGE50] Marcados ${idsParaMarcarCsv.length} pedidos como exportados a SAGE50 (CSV)`);
    
    res.send(bom + csv);

  } catch (error) {
    console.error('[SAGE50] Error al exportar CSV:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor al exportar CSV para SAGE50.',
      details: error.message 
    });
  }
};

// Función auxiliar para generar líneas de albarán (reutilizable)
async function generarLineasAlbaran(pedidos) {
  const lineasAlbaran = [];
  let contadorFactura = 1;

  for (const pedido of pedidos) {
    let datosCliente = {};
    
    // Obtener datos del cliente
    if (pedido.clienteId) {
      try {
        const cliente = await Cliente.findById(pedido.clienteId);
        if (cliente) {
          datosCliente = {
            codigo: cliente.codigo || cliente.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
            nombre: generarNombreCompletoSage(cliente, pedido.clienteNombre),
            nif: cliente.nif || pedido.nif || '',
            direccion: cliente.direccion || pedido.direccion || '',
            codigoPostal: cliente.codigoPostal || pedido.codigoPostal || '',
            poblacion: cliente.poblacion || pedido.poblacion || '',
            provincia: cliente.provincia || pedido.provincia || '',
            telefono: cliente.telefono || pedido.telefono || '',
            email: cliente.email || pedido.email || ''
          };
        }
      } catch (error) {
        console.warn(`[SAGE50] No se pudo obtener datos del cliente ${pedido.clienteId}`);
      }
    }

    // Fallback a datos del pedido
    if (!datosCliente.codigo) {
      datosCliente = {
        codigo: pedido.codigoCliente || pedido.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
        nombre: pedido.clienteNombre || 'Cliente',
        nif: pedido.nif || '',
        direccion: pedido.direccion || '',
        codigoPostal: pedido.codigoPostal || '',
        poblacion: pedido.poblacion || '',
        provincia: pedido.provincia || '',
        telefono: pedido.telefono || '',
        email: pedido.email || ''
      };
    }

    const fechaAlbaran = pedido.fechaEnvio || pedido.fechaPedido || new Date();
    const fechaFormateada = new Date(fechaAlbaran).toLocaleDateString('es-ES');
    const numeroAlbaran = `ALB${String(pedido.numeroPedido || contadorFactura).padStart(6, '0')}`;
    const numeroFactura = `FR${String(contadorFactura).padStart(6, '0')}`;

    // Procesar líneas del pedido
    if (pedido.lineas && pedido.lineas.length > 0) {
      pedido.lineas.forEach((linea, index) => {
        if (!linea.esComentario && linea.producto) {
          // 🔧 APLICAR MISMA LÓGICA DE UNIDADES QUE EN EXCEL
          let cantidadFinal;
          const esWooCommerce = Boolean(pedido.numeroPedidoWoo || pedido.datosFacturaWoo);
          
          if (esWooCommerce) {
            // 🛒 PEDIDOS WOOCOMMERCE: Siempre usar cantidad original
            cantidadFinal = linea.cantidad || 0;
          } else {
            // 🏪 PEDIDOS NORMALES: Lógica basada en el valor del peso
            // SI peso > 0 → usar PESO para UNIDADES
            // SI peso = 0 → usar CANTIDAD ENVIADA para UNIDADES
            if (linea.peso && linea.peso > 0) {
              cantidadFinal = linea.peso; // 🔧 PESO > 0: Usar peso
            } else {
              cantidadFinal = linea.cantidadEnviada || linea.cantidad || 0; // 🔧 PESO = 0: Usar cantidad enviada
            }
          }
          
          const precioUnitario = linea.precio || linea.precioUnitario || 0;
          const descuento1 = linea.descuento || 0;

          // 🆕 MAPEO CORRECTO DE CAMPOS DESDE EL PEDIDO EN LA FUNCIÓN AUXILIAR
          const serieFactura = pedido.serieFacturacion || 'A';
          const almacenExpedicion = pedido.almacenExpedicion || '01';
          const formaPagoSage = pedido.formaPago || '01';
          const vendedorSage = pedido.vendedor || '01';
          const codigoProductoSage = linea.codigo || `ART${String(index + 1).padStart(5, '0')}`; // 🔧 USAR CAMPO 'codigo' PARA SAGE50

          lineasAlbaran.push({
            serie: serieFactura, // 🆕 USAR SERIE DEL PEDIDO
            albaran: numeroAlbaran,
            cliente: datosCliente.codigo,
            fecha: fechaFormateada,
            almacen: almacenExpedicion, // 🆕 USAR ALMACÉN DEL PEDIDO
            formapago: formaPagoSage, // 🆕 USAR FORMA DE PAGO DEL PEDIDO
            vendedor: vendedorSage, // 🆕 USAR VENDEDOR DEL PEDIDO
            articulo: codigoProductoSage, // 🆕 USAR CÓDIGO SAGE DEL PRODUCTO
            definicion: linea.producto,
            unidades: cantidadFinal,
            precio: precioUnitario.toString().replace('.', ','),
            dto1: descuento1, // 🆕 USAR DESCUENTO DE LA LÍNEA
            dto2: 0,
            Obra: '',
            factura: numeroFactura,
            fechafra: fechaFormateada,
            observaciones: linea.comentario || '',
            nombrecliente: datosCliente.nombre,
            cifcliente: datosCliente.nif,
            dircliente: datosCliente.direccion,
            cpcliente: datosCliente.codigoPostal,
            pobcliente: datosCliente.poblacion,
            provcliente: datosCliente.provincia,
            telfcliente: datosCliente.telefono,
            emailcliente: datosCliente.email
          });
        }
      });
    }

    contadorFactura++;
  }

  return lineasAlbaran;
}

/**
 * Desmarcar un pedido como no exportado a SAGE50
 */
const desmarcarExportado = async (req, res) => {
  try {
    const { pedidoId } = req.body;
    
    if (!pedidoId) {
      return res.status(400).json({ error: 'Se requiere el ID del pedido.' });
    }

    await PedidoCliente.findByIdAndUpdate(
      pedidoId,
      { 
        exportadoSage: false,
        $unset: { fechaExportacionSage: 1 }
      }
    );
    
    console.log(`[SAGE50] Pedido ${pedidoId} desmarcado como no exportado`);
    res.json({ message: 'Pedido desmarcado correctamente.' });
    
  } catch (error) {
    console.error('[SAGE50] Error al desmarcar pedido:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor.',
      details: error.message 
    });
  }
};

module.exports = {
  exportarPedidos,
  exportarPedidosCSV,
  desmarcarExportado,
};