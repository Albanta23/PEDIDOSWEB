// Controlador para pedidos de clientes/expediciones
const PedidoCliente = require('./models/PedidoCliente');
const { registrarBajaStock } = require('./utils/stock');

module.exports = {
  async listar(req, res) {
    try {
      // Filtros: clienteId, fechaInicio, fechaFin
      const { clienteId, fechaInicio, fechaFin } = req.query;
      let filtro = {};
      if (clienteId) filtro.clienteId = clienteId;
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
      // Si no hay fechaPedido, usar fechaCreacion como fallback
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
      res.json(pedidos);
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
      const { id } = req.params;
      const pedidoPrevio = await PedidoCliente.findById(id);
      if (!pedidoPrevio) return res.status(404).json({ error: 'Pedido no encontrado' });
      const { estado, usuarioTramitando, lineas, bultos } = req.body;
      console.log('Bultos recibidos en backend:', bultos);
      let update = { ...req.body };
      // Cambios de estado y registro en historial
      if (estado && estado !== pedidoPrevio.estado) {
        update.$push = { historialEstados: { estado, usuario: usuarioTramitando || req.body.usuario || 'expediciones', fecha: new Date() } };
        update.usuarioTramitando = usuarioTramitando || req.body.usuario || 'expediciones';
      }
      // Si el estado pasa a preparado, generar movimientos de stock
      if (estado === 'preparado' && pedidoPrevio.estado !== 'preparado') {
        for (const linea of (lineas || pedidoPrevio.lineas)) {
          if (linea.esComentario) continue;
          if (!linea.producto || !linea.cantidad) continue;
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidad,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Expedición cliente (${pedidoPrevio.clienteNombre})`,
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
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
      res.json(pedidoActualizado);
    } catch (err) {
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
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        } else {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidadDevuelta,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Baja por devolución cliente (parcial): ${motivo}`,
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        }
      }

      pedido.historialEstados.push({ estado: 'devuelto_parcial', usuario: 'expediciones', fecha: new Date() });
      pedido.devoluciones = pedido.devoluciones || [];
      pedido.devoluciones.push({ tipo: 'parcial', fecha: new Date(), lineas, motivo });
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
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        } else {
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidad,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Baja por devolución cliente (total): ${motivo}`,
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        }
      }

      pedido.estado = 'devuelto_total';
      pedido.historialEstados.push({ estado: 'devuelto_total', usuario: 'expediciones', fecha: new Date() });
      pedido.devoluciones = pedido.devoluciones || [];
      pedido.devoluciones.push({ tipo: 'total', fecha: new Date(), motivo });
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
  }
};
