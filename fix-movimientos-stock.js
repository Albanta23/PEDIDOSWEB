// Implementación mejorada del endpoint para consultar movimientos de stock
app.get('/api/movimientos-stock', async (req, res) => {
  try {
    const { tiendaId, producto, lote, fechaInicio, fechaFin, desde, hasta } = req.query;
    
    console.log(`[STOCK] Consultando movimientos para tienda: ${tiendaId || 'todas'}, producto: ${producto || 'todos'}, lote: ${lote || 'todos'}`);
    
    let filtro = {};
    
    // Filtro por tienda (obligatorio para seguridad)
    if (tiendaId) {
      filtro.tiendaId = tiendaId;
      console.log(`[STOCK] Filtrando por tiendaId: ${tiendaId}`);
    }
    
    // Filtro por producto
    if (producto) {
      filtro.producto = producto;
      console.log(`[STOCK] Filtrando por producto: ${producto}`);
    }
    
    // Filtro por lote
    if (lote) {
      filtro.lote = lote;
      console.log(`[STOCK] Filtrando por lote: ${lote}`);
    }
    
    // Filtro por fecha (compatibilidad con nombres de parámetros)
    // Acepta tanto fechaInicio/fechaFin como desde/hasta
    const fechaDesde = fechaInicio || desde;
    const fechaHasta = fechaFin || hasta;
    
    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      
      if (fechaDesde) {
        try {
          const inicio = new Date(fechaDesde);
          // Verificar que la fecha sea válida
          if (!isNaN(inicio.getTime())) {
            filtro.fecha.$gte = inicio;
            console.log(`[STOCK] Filtrando desde: ${inicio.toISOString()}`);
          } else {
            console.log(`[STOCK] Fecha inicio inválida: ${fechaDesde}, ignorando`);
          }
        } catch (err) {
          console.log(`[STOCK] Error al parsear fecha inicio: ${err.message}`);
        }
      }
      
      if (fechaHasta) {
        try {
          const fin = new Date(fechaHasta);
          // Verificar que la fecha sea válida
          if (!isNaN(fin.getTime())) {
            fin.setHours(23, 59, 59, 999); // Final del día
            filtro.fecha.$lte = fin;
            console.log(`[STOCK] Filtrando hasta: ${fin.toISOString()}`);
          } else {
            console.log(`[STOCK] Fecha fin inválida: ${fechaHasta}, ignorando`);
          }
        } catch (err) {
          console.log(`[STOCK] Error al parsear fecha fin: ${err.message}`);
        }
      }
      
      // Si no se pudo aplicar ningún filtro de fecha válido, eliminar el objeto fecha
      if (Object.keys(filtro.fecha).length === 0) {
        delete filtro.fecha;
      }
    }
    
    console.log(`[STOCK] Filtro completo:`, JSON.stringify(filtro));
    
    const movimientos = await MovimientoStock.find(filtro).sort({ fecha: -1 }).limit(1000);
    console.log(`[STOCK] Encontrados ${movimientos.length} movimientos`);
    
    res.json(movimientos);
  } catch (e) {
    console.error(`[ERROR] Error al consultar movimientos de stock: ${e.message}`);
    res.status(500).json({ error: e.message });
  }
});
