// Controlador para pedidos de clientes/expediciones
const PedidoCliente = require('./models/PedidoCliente');
const { registrarBajaStock } = require('./utils/stock');

module.exports = {
  // Endpoint para obtener un pedido por ID y devolver historial combinado
  async obtenerPorId(req, res) {
    try {
      const { id } = req.params;
      const pedido = await PedidoCliente.findById(id);
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

      // Combinar historialEstados e historialBultos en un solo array, ordenado por fecha
      const historialEstados = (pedido.historialEstados || []).map(h => {
        let obj = (typeof h.toObject === 'function') ? h.toObject() : h;
        return {
          ...obj,
          tipo: 'estado',
          fecha: obj.fecha || obj.createdAt,
          accion: obj.estado
        };
      });
      const historialBultos = (pedido.historialBultos || []).map(h => {
        let obj = (typeof h.toObject === 'function') ? h.toObject() : h;
        return {
          ...obj,
          tipo: 'bultos',
          fecha: obj.fecha || obj.createdAt,
          accion: 'Actualización de bultos',
          bultos: obj.bultos
        };
      });
      const historial = [...historialEstados, ...historialBultos].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      res.json({
        ...pedido.toObject(),
        historial
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async listar(req, res) {
    try {
      // Filtros: clienteId, nombreCliente, fechaInicio, fechaFin, estado, origen.tipo, enHistorialDevoluciones
      const { clienteId, nombreCliente, fechaInicio, fechaFin, estado, origen, enHistorialDevoluciones } = req.query;
      let filtro = {};
      
      // Búsqueda por cliente - combinando ID y nombre
      if (clienteId || nombreCliente) {
        filtro.$or = [];
        
        // Si tenemos ID del cliente - búsqueda exacta
        if (clienteId) {
          filtro.$or.push({ clienteId: clienteId });
          filtro.$or.push({ "cliente._id": clienteId });
          filtro.$or.push({ cliente: clienteId });
        }
        
        // Si tenemos nombre del cliente - búsqueda exacta para evitar confusiones
        if (nombreCliente) {
          // Usar una expresión regular que coincida exactamente con el nombre, no parcialmente
          const nombreRegexExacto = new RegExp('^' + nombreCliente.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i');
          filtro.$or.push({ clienteNombre: nombreRegexExacto });
          filtro.$or.push({ "cliente.nombre": nombreRegexExacto });
          
          // Para el campo cliente como string, necesitamos una comparación exacta
          filtro.$or.push({ cliente: nombreRegexExacto });
        }
      }
      
      // Otros filtros
      if (estado) {
        filtro.estado = estado;
      } else {
        // Excluir pedidos cerrados si no se pide un estado específico
        filtro.estado = { $nin: ['preparado', 'cancelado', 'devuelto_total'] };
      }
      if (origen && origen.tipo) filtro['origen.tipo'] = origen.tipo;
      
      // Filtro por fecha
      if (fechaInicio || fechaFin) {
        filtro.fechaPedido = {};
        if (fechaInicio) filtro.fechaPedido.$gte = new Date(fechaInicio);
        if (fechaFin) {
          // Incluir todo el día de fechaFin
          const fin = new Date(fechaFin);
          fin.setHours(23,59,59,999);
          filtro.fechaPedido.$lte = fin;
        }
      }
      
      // Filtro por estado de devolución
      if (typeof enHistorialDevoluciones === 'undefined') {
        filtro.enHistorialDevoluciones = { $ne: true };
      } else if (enHistorialDevoluciones === 'true') {
        filtro.enHistorialDevoluciones = true;
      } else if (enHistorialDevoluciones === 'false') {
        filtro.enHistorialDevoluciones = { $ne: true };
      }
      
      // Buscar pedidos
      let pedidos = await PedidoCliente.find(filtro);
      
      // Si no hay filtro de fecha y los pedidos no tienen fechaPedido, filtrar por fechaCreacion
      if ((fechaInicio || fechaFin) && pedidos.length === 0) {
        let filtroCreacion = { ...filtro };
        delete filtroCreacion.fechaPedido;
        filtroCreacion.fechaCreacion = {};
        if (fechaInicio) filtroCreacion.fechaCreacion.$gte = new Date(fechaInicio);
        if (fechaFin) {
          const fin = new Date(fechaFin);
          fin.setHours(23,59,59,999);
          filtroCreacion.fechaCreacion.$lte = fin;
        }
        pedidos = await PedidoCliente.find(filtroCreacion);
      }
      
      // Asegurar que todos los pedidos devuelvan el campo 'bultos' aunque sea null
      const pedidosConBultos = pedidos.map(p => {
        const plain = p.toObject ? p.toObject() : p;
        if (typeof plain.bultos === 'undefined') plain.bultos = null;
        return plain;
      });
      res.json(pedidosConBultos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async crear(req, res) {
    try {
      const ultimoPedido = await PedidoCliente.findOne({}, {}, { sort: { numeroPedido: -1 } });
      const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
      const nuevoPedido = new PedidoCliente({
        ...req.body,
        numeroPedido: siguienteNumero,
        fechaCreacion: req.body.fechaCreacion || new Date(),
        fechaPedido: req.body.fechaPedido,
        estado: 'en_espera',
        historialEstados: [{ estado: 'en_espera', usuario: req.body.usuarioTramitando || 'cliente', fecha: new Date() }],
        usuarioTramitando: ''
      });
      const pedidoGuardado = await nuevoPedido.save();
      res.status(201).json(pedidoGuardado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  async actualizar(req, res) {
    try {
      console.log('[ACTUALIZAR PEDIDO] ID:', req.params.id);
      console.log('[ACTUALIZAR PEDIDO] Body:', JSON.stringify(req.body, null, 2));
      

      const { id } = req.params;
      const pedidoPrevio = await PedidoCliente.findById(id);
      if (!pedidoPrevio) return res.status(404).json({ error: 'Pedido no encontrado' });
      const { estado, usuarioTramitando, lineas, bultos } = req.body;

      // Preparar operadores de actualización
      const update = {};
      // $set para campos directos
      update.$set = {};
      // $push para arrays
      update.$push = {};

      // Actualizar campos directos
      Object.keys(req.body).forEach(key => {
        if (!["historialEstados", "historialBultos"].includes(key)) {
          update.$set[key] = req.body[key];
        }
      });

      if (bultos) {
        update.$set.bultos = bultos;
        update.$push.historialBultos = { bultos, fecha: new Date(), usuario: usuarioTramitando || req.body.usuario || 'expediciones' };
      }

      // Log detallado antes de la operación
      console.log(`[DEBUG] Estado previo del historialEstados:`, pedidoPrevio.historialEstados);

      // Cambios de estado y registro en historial
      if (estado && estado !== pedidoPrevio.estado) {
        // Solo permitir migrar si el pedido ha sido revisado y completado
        if (pedidoPrevio.estado === 'borrador_woocommerce' && estado !== 'borrador_woocommerce') {
          if (!pedidoPrevio.revisado) {
            return res.status(400).json({ error: 'El pedido debe ser revisado y completado en clientes-gestion antes de migrar.' });
          }
          update.$set.estado = estado;
        }
        // Log detallado de la operación
        console.log(`[DEBUG] Intentando agregar al historialEstados:`, {
          estado,
          usuario: usuarioTramitando || req.body.usuario || 'expediciones',
          fecha: new Date()
        });

        update.$push.historialEstados = { estado, usuario: usuarioTramitando || req.body.usuario || 'expediciones', fecha: new Date() };
        update.$set.usuarioTramitando = usuarioTramitando || req.body.usuario || 'expediciones';
      }

      // Si no hay nada que pushear, eliminar $push
      if (Object.keys(update.$push).length === 0) {
        delete update.$push;
      }
      // Si no hay nada que setear, eliminar $set
      if (Object.keys(update.$set).length === 0) {
        delete update.$set;
      }

      // Log detallado después de la operación
      if (update.$push && update.$push.historialEstados) {
        console.log(`[DEBUG] Estado actualizado del historialEstados:`, update.$push.historialEstados);
      }

      // Si el estado pasa a preparado, generar movimientos de stock
      if (estado === 'preparado' && pedidoPrevio.estado !== 'preparado') {
        for (const linea of (lineas || pedidoPrevio.lineas)) {
          if (linea.esComentario) continue;
          if (!linea.producto || !linea.cantidad) continue;
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: -Math.abs(linea.cantidad),
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Expedición cliente (${pedidoPrevio.clienteNombre})`,
            peso: typeof linea.peso !== 'undefined' ? -Math.abs(linea.peso) : undefined
          });
        }
      }
      // Si el estado pasa a cancelado y antes no estaba cancelado, reponer stock
      if (estado === 'cancelado' && pedidoPrevio.estado !== 'cancelado') {
        for (const linea of (lineas || pedidoPrevio.lineas)) {
          if (linea.esComentario) continue;
          if (!linea.producto || !linea.cantidad) continue;
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: -Math.abs(linea.cantidad), // Reponer stock (entrada)
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Reposición por cancelación pedido cliente (${pedidoPrevio.clienteNombre})`,
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        }
      }
      const pedidoActualizado = await PedidoCliente.findByIdAndUpdate(id, update, { new: true });
      console.log('[ACTUALIZAR PEDIDO] Éxito. Pedido actualizado:', pedidoActualizado._id);
      res.json(pedidoActualizado);
    } catch (err) {
      console.log('[ACTUALIZAR PEDIDO] Error:', err.message);
      console.log('[ACTUALIZAR PEDIDO] Stack:', err.stack);
      res.status(400).json({ error: err.message });
    }
  },

  async devolucionParcial(req, res) {
    try {
      const { id } = req.params;
      const { lineas, motivo } = req.body;
      const pedido = await PedidoCliente.findById(id);
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

      for (const linea of lineas) {
        if (linea.aptoParaVenta) {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: -Math.abs(linea.cantidadDevuelta),
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Devolución cliente (parcial): ${motivo}`,
            peso: linea.pesoDevuelto || linea.peso || undefined
          });
        } else {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidadDevuelta,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Baja por devolución cliente (parcial): ${motivo}`,
            peso: linea.pesoDevuelto || linea.peso || undefined
          });
        }
      }

      pedido.estado = 'devuelto_parcial';
      pedido.historialEstados.push({ estado: 'devuelto_parcial', usuario: 'expediciones', fecha: new Date() });
      pedido.devoluciones = pedido.devoluciones || [];
      pedido.devoluciones.push({ tipo: 'parcial', fecha: new Date(), lineas, motivo });
      pedido.enHistorialDevoluciones = true; // Marcar para historial de devoluciones
      await pedido.save();

      res.json(pedido);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async devolucionTotal(req, res) {
    try {
      const { id } = req.params;
      const { motivo, aptoParaVenta } = req.body;
      const pedido = await PedidoCliente.findById(id);
      if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

      for (const linea of pedido.lineas) {
        if (linea.esComentario) continue;
        if (aptoParaVenta) {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: -Math.abs(linea.cantidad),
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Devolución cliente (total): ${motivo}`,
            peso: linea.peso || undefined
          });
        } else {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidad,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Baja por devolución cliente (total): ${motivo}`,
            peso: linea.peso || undefined
          });
        }
      }

      pedido.estado = 'devuelto_total';
      pedido.historialEstados.push({ estado: 'devuelto_total', usuario: 'expediciones', fecha: new Date() });
      pedido.devoluciones = pedido.devoluciones || [];
      pedido.devoluciones.push({ tipo: 'total', fecha: new Date(), motivo });
      pedido.enviado = false; // Eliminar del historial de envío
      pedido.enHistorialDevoluciones = true; // Marcar para historial de devoluciones
      await pedido.save();

      res.json(pedido);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const pedidoEliminado = await PedidoCliente.findOneAndDelete({ _id: id });
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  /**
   * Registrar devolución de cliente (entrada de stock)
   * Espera body: { pedidoId, devoluciones: [{ producto, cantidad, unidad, lote, peso, comentario }] }
   */
  async registrarDevolucion(req, res) {
    try {
      const { pedidoId, devoluciones } = req.body;
      if (!pedidoId || !Array.isArray(devoluciones) || devoluciones.length === 0) {
        return res.status(400).json({ error: 'Faltan datos para registrar devolución' });
      }
      for (const dev of devoluciones) {
        if (!dev.producto || !dev.cantidad) continue;
        await registrarBajaStock({
          tiendaId: 'almacen_central',
          producto: dev.producto,
          cantidad: dev.cantidad,
          unidad: dev.unidad || 'kg',
          lote: dev.lote || '',
          motivo: `Devolución cliente (pedido ${pedidoId})${dev.comentario ? ': ' + dev.comentario : ''}`,
          peso: typeof dev.peso !== 'undefined' ? dev.peso : undefined
        });
      }
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  
  // Nuevo método para asignar cliente a un pedido
  async asignarCliente(req, res) {
    try {
      const { id } = req.params;
      const { clienteId, verificadoManualmente } = req.body;
      
      if (!id || !clienteId) {
        return res.status(400).json({ error: 'ID de pedido y clienteId son requeridos' });
      }
      
      const pedido = await PedidoCliente.findById(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      // Actualizar el pedido con la información del cliente
      pedido.clienteId = clienteId;
      pedido.verificadoManualmente = verificadoManualmente || false;
      pedido.clienteExistente = true;
      pedido.clienteCreado = false;
      
      await pedido.save();
      res.json(pedido);
    } catch (error) {
      console.error('Error al asignar cliente a pedido:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Nuevo endpoint para procesar un pedido de borrador a pedido normal
  async procesarPedidoBorrador(req, res) {
    try {
      const { id } = req.params;
      const { usuario } = req.body;
      
      const pedido = await PedidoCliente.findById(id);
      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }
      
      if (pedido.estado !== 'borrador_woocommerce') {
        return res.status(400).json({ error: 'Este pedido no está en estado borrador' });
      }
      
      // Actualizar el estado del pedido
      pedido.estado = 'en_espera';
      
      // Registrar el cambio de estado en el historial
      pedido.historialEstados.push({
        estado: 'en_espera',
        usuario: usuario || 'sistema',
        fecha: new Date()
      });
      
      // Asegurarse de que esté marcado como pedido de tienda online
      pedido.esTiendaOnline = true;
      
      await pedido.save();
      
      res.json({ 
        ok: true, 
        mensaje: 'Pedido procesado correctamente', 
        pedido 
      });
    } catch (error) {
      console.error('Error al procesar pedido borrador:', error);
      res.status(500).json({ error: error.message });
    }
  }
};
