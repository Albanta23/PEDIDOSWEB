// Implementación mejorada del endpoint para consultar lotes
app.get('/api/lotes/:productoId', async (req, res) => {
  try {
    const { productoId } = req.params;
    const { fecha } = req.query; // Opcional, para filtrado por fecha
    
    console.log(`[LOTES] Consultando lotes para producto: ${productoId}, fecha: ${fecha || 'no especificada'}`);
    
    let fechaConsulta = null;
    if (fecha) {
      try {
        fechaConsulta = new Date(fecha);
        // Si la fecha es inválida, ignoramos el filtro
        if (isNaN(fechaConsulta.getTime())) {
          fechaConsulta = null;
          console.log(`[LOTES] Fecha proporcionada inválida: ${fecha}, ignorando filtro`);
        }
      } catch (err) {
        console.log(`[LOTES] Error al parsear fecha: ${err.message}`);
      }
    }
    
    // Construimos el filtro base para el producto
    let filtro = { producto: productoId };
    
    // Si hay fecha, añadimos condición
    if (fechaConsulta) {
      // Mostramos lotes con fecha de entrada anterior o igual a la fecha de consulta
      filtro.fechaEntrada = { $lte: fechaConsulta };
    }
    
    // Modificamos la consulta para mostrar todos los lotes que tengan disponibilidad
    // positiva en cantidad O en peso
    filtro.$or = [
      { cantidadDisponible: { $gt: 0 } },
      { pesoDisponible: { $gt: 0 } }
    ];
    
    console.log(`[LOTES] Filtro aplicado:`, JSON.stringify(filtro));
    
    const lotes = await Lote.find(filtro).sort({ fechaEntrada: 1 });
    
    console.log(`[LOTES] Encontrados ${lotes.length} lotes para producto ${productoId}`);
    if (lotes.length > 0) {
      lotes.forEach(lote => {
        console.log(`  - Lote: ${lote.lote}, Cantidad: ${lote.cantidadDisponible}, Peso: ${lote.pesoDisponible}, Fecha: ${lote.fechaEntrada}`);
      });
    } else {
      console.log(`  - No se encontraron lotes con stock disponible`);
    }
    
    res.json(lotes);
  } catch (err) {
    console.error(`[ERROR] Error al consultar lotes: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});
