const PedidoCliente = require('./models/PedidoCliente');
const Cliente = require('./models/Cliente');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

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
              codigo: cliente.codigoSage || cliente.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
              nombre: cliente.razonSocial || cliente.nombre || pedido.clienteNombre,
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
            const cantidadFinal = linea.cantidadEnviada || linea.cantidad || 0;
            const precioUnitario = linea.precio || 0;
            const descuento1 = 0; // Se puede calcular si hay descuentos
            const descuento2 = 0;

            lineasAlbaran.push({
              serie: 'SF', // Serie por defecto
              albaran: numeroAlbaran,
              cliente: datosCliente.codigo,
              fecha: fechaFormateada,
              almacen: '00', // Almacén por defecto
              formapago: '01', // Forma de pago por defecto (contado)
              vendedor: '01', // Vendedor por defecto
              articulo: linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`,
              definicion: linea.producto,
              unidades: cantidadFinal,
              precio: precioUnitario.toString().replace('.', ','), // SAGE50 usa coma decimal
              dto1: descuento1,
              dto2: descuento2,
              Obra: '', // Campo obra vacío
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
          } else if (linea.esComentario && linea.comentario) {
            // Línea de comentario/observación
            lineasAlbaran.push({
              serie: 'SF',
              albaran: numeroAlbaran,
              cliente: datosCliente.codigo,
              fecha: fechaFormateada,
              almacen: '00',
              formapago: '01',
              vendedor: '01',
              articulo: '', // Artículo vacío para comentarios
              definicion: linea.comentario,
              unidades: '',
              precio: '',
              dto1: '',
              dto2: '',
              Obra: '',
              factura: numeroFactura,
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
            });
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
    const worksheet = XLSX.utils.json_to_sheet(lineasAlbaran, {
      header: [
        'serie', 'albaran', 'cliente', 'fecha', 'almacen', 'formapago', 'vendedor',
        'articulo', 'definicion', 'unidades', 'precio', 'dto1', 'dto2', 'Obra',
        'factura', 'fechafra', 'observaciones', 'nombrecliente', 'cifcliente',
        'dircliente', 'cpcliente', 'pobcliente', 'provcliente', 'telfcliente', 'emailcliente'
      ]
    });

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
            codigo: cliente.codigoSage || cliente.nif || `CLI${String(contadorFactura).padStart(6, '0')}`,
            nombre: cliente.razonSocial || cliente.nombre || pedido.clienteNombre,
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
          const cantidadFinal = linea.cantidadEnviada || linea.cantidad || 0;
          const precioUnitario = linea.precio || 0;

          lineasAlbaran.push({
            serie: 'SF',
            albaran: numeroAlbaran,
            cliente: datosCliente.codigo,
            fecha: fechaFormateada,
            almacen: '00',
            formapago: '01',
            vendedor: '01',
            articulo: linea.codigoSage || `ART${String(index + 1).padStart(5, '0')}`,
            definicion: linea.producto,
            unidades: cantidadFinal,
            precio: precioUnitario.toString().replace('.', ','),
            dto1: 0,
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

module.exports = {
  exportarPedidos,
  exportarPedidosCSV,
};