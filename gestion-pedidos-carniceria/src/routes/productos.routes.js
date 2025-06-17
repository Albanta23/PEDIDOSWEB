const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');
const { defaultLimiter, bulkOperationLimiter } = require('../middlewares/rateLimit');

// POST /api/productos/importar (Importar productos desde Excel)
router.post('/importar', bulkOperationLimiter, async (req, res) => {
  try {
    console.log('[IMPORTAR][HEADERS]', req.headers);
    console.log('[IMPORTAR][RAW BODY]', JSON.stringify(req.body));
    const productos = req.body.productos;
    console.log('[IMPORTAR] Recibidos productos:', productos?.length, productos?.[0]);
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para importar' });
    }
    let insertados = 0, actualizados = 0, errores = [];
    function mapearProductoExcel(prodExcel) {
      return {
        referencia: prodExcel['Cód.'] || prodExcel['Cod.'] || prodExcel['Código'] || '',
        nombre: prodExcel['Descripción'] || prodExcel['Nombre'] || '',
        familia: prodExcel['C.Fam.'] || prodExcel['Familia'] || '',
        nombreFamilia: prodExcel['Nombre Familia'] || '',
        unidad: prodExcel['Unidad'] || 'kg',
        activo: prodExcel['Activo'] !== undefined ? Boolean(prodExcel['Activo']) : true,
        descripcion: prodExcel['Descripción'] || '',
      };
    }
    for (const prod of productos) {
      const prodMapeado = mapearProductoExcel(prod);
      if (!prodMapeado.nombre) continue;
      try {
        const filtro = prodMapeado.referencia ? { referencia: prodMapeado.referencia } : { nombre: prodMapeado.nombre };
        const existente = await Producto.findOne(filtro);
        if (existente) {
          await Producto.updateOne(filtro, { $set: prodMapeado });
          actualizados++;
        } else {
          await Producto.create(prodMapeado);
          insertados++;
        }
      } catch (e) {
        errores.push({ nombre: prodMapeado.nombre, error: e.message });
        console.error('[IMPORTAR][ERROR]', prodMapeado.nombre, e.message);
      }
    }
    console.log('[IMPORTAR] Resultado:', {insertados, actualizados, errores});
    res.json({ ok: true, insertados, actualizados, errores });
  } catch (e) {
    console.error('Error in POST /api/productos/importar:', e);
    // console.error('[IMPORTAR][FATAL]', e.message); // This was the specific log from before
    res.status(500).json({ error: 'Error fatal durante la importación de productos: ' + e.message });
  }
});

// GET /api/productos (Obtener todos los productos)
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (e) {
    console.error('Error in GET /api/productos:', e);
    res.status(500).json({ error: 'Error al obtener los productos: ' + e.message });
  }
});

// POST /api/productos/actualizar-masivo (Actualizar productos masivamente)
router.post('/actualizar-masivo', bulkOperationLimiter, async (req, res) => {
  try {
    const productos = req.body.productos;
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({ error: 'No se recibieron productos para actualizar' });
    }
    let actualizados = 0, errores = [];
    for (const prod of productos) {
      if (!prod._id) continue;
      try {
        await Producto.updateOne({ _id: prod._id }, { $set: prod });
        actualizados++;
      } catch (e) {
        errores.push({ nombre: prod.nombre, error: e.message });
      }
    }
    res.json({ ok: true, actualizados, errores });
  } catch (e) {
    console.error('Error in POST /api/productos/actualizar-masivo:', e);
    res.status(500).json({ error: 'Error durante la actualización masiva de productos: ' + e.message });
  }
});

// DELETE /api/productos/:id (Borrar producto por ID)
router.delete('/:id', defaultLimiter, async (req, res) => {
  try {
    const id = req.params.id;
    await Producto.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e) {
    console.error(`Error in DELETE /api/productos/${req.params.id}:`, e);
    if (e.name === 'CastError') {
      res.status(400).json({ error: 'ID de producto inválido: ' + e.message });
    } else {
      res.status(500).json({ error: 'Error al eliminar el producto: ' + e.message });
    }
  }
});

// POST /api/productos (Crear producto individual)
router.post('/', defaultLimiter, async (req, res) => {
  try {
    const nuevo = req.body;
    if (!nuevo.nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const existe = await Producto.findOne({ $or: [ { nombre: nuevo.nombre }, { referencia: nuevo.referencia } ] });
    if (existe) return res.status(400).json({ error: 'Ya existe un producto con ese nombre o referencia' });
    const creado = await Producto.create(nuevo);
    res.json(creado);
  } catch (e) {
    console.error('Error in POST /api/productos:', e);
    if (e.name === 'ValidationError') {
      res.status(400).json({ error: 'Error de validación al crear el producto: ' + e.message, details: e.errors });
    } else {
      res.status(500).json({ error: 'Error al crear el producto: ' + e.message });
    }
  }
});

module.exports = router;
