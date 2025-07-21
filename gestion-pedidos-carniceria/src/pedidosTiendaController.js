// Controlador para pedidos de tienda/fábrica
const Pedido = require('./models/Pedido');
const { registrarBajaStock } = require('./utils/stock');

module.exports = {
  async listar(req, res) {
    try {
      // Solo pedidos de tienda/fábrica (excluye clientes)
      const pedidos = await Pedido.find({ tiendaId: { $ne: 'clientes' } });
      res.json(pedidos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async crear(req, res) {
    try {
      const ultimoPedido = await Pedido.findOne({ tiendaId: { $ne: 'clientes' } }, {}, { sort: { numeroPedido: -1 } });
      const siguienteNumero = (ultimoPedido?.numeroPedido || 0) + 1;
      const nuevoPedido = new Pedido({
        ...req.body,
        numeroPedido: siguienteNumero,
        fechaCreacion: req.body.fechaCreacion || new Date(),
        fechaPedido: req.body.fechaPedido,
        fechaEnvio: req.body.fechaEnvio,
        fechaRecepcion: req.body.fechaRecepcion
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
      const pedidoPrevio = await Pedido.findById(id);
      if (!pedidoPrevio || pedidoPrevio.tiendaId === 'clientes') return res.status(404).json({ error: 'Pedido no encontrado' });
      const pedidoActualizado = await Pedido.findByIdAndUpdate(id, req.body, { new: true });
      // Registrar movimientos de stock si el estado cambió a 'enviadoTienda'
      if (pedidoActualizado && pedidoPrevio.estado !== 'enviadoTienda' && pedidoActualizado.estado === 'enviadoTienda') {
        for (const linea of pedidoActualizado.lineas) {
          if (linea.esComentario) continue;
          if (!linea.producto || !linea.cantidadEnviada) continue;
          await registrarBajaStock({
            tiendaId: 'almacen_central',
            producto: linea.producto,
            cantidad: linea.cantidadEnviada,
            unidad: linea.formato || 'kg',
            lote: linea.lote || '',
            motivo: `Salida a tienda (${pedidoActualizado.tiendaId}) por pedido`,
            peso: typeof linea.peso !== 'undefined' ? linea.peso : undefined
          });
        }
      }
      res.json(pedidoActualizado);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const pedidoEliminado = await Pedido.findOneAndDelete({ _id: id, tiendaId: { $ne: 'clientes' } });
      if (!pedidoEliminado) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
