// Controlador para clientes
const Cliente = require('./models/Cliente');

module.exports = {
  async listar(req, res) {
    try {
      const { busqueda } = req.query;
      let filtro = {};
      
      if (busqueda) {
        // Buscar por nombre, NIF, email o teléfono
        filtro = {
          $or: [
            { nombre: { $regex: busqueda, $options: 'i' } },
            { nif: { $regex: busqueda, $options: 'i' } },
            { email: { $regex: busqueda, $options: 'i' } },
            { telefono: { $regex: busqueda, $options: 'i' } },
            { codigoSage: { $regex: busqueda, $options: 'i' } } // Añadir búsqueda por código SAGE
          ]
        };
      }
      
      const clientes = await Cliente.find(filtro);
      res.json(clientes);
    } catch (error) {
      console.error('Error al listar clientes:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  async obtener(req, res) {
    try {
      const { id } = req.params;
      const cliente = await Cliente.findById(id);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      console.error('Error al obtener cliente:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  async crear(req, res) {
    try {
      const datosCliente = req.body;
      
      // Verificar si se requiere un código SAGE50 automático
      if (!datosCliente.codigoCliente) {
        // Buscar el último código 430... en la base de datos
        const ultimoCliente430 = await Cliente.findOne(
          { codigoCliente: /^430/ }, 
          {}, 
          { sort: { codigoCliente: -1 } }
        );
        
        let nuevoCodigo = '4300001';
        if (ultimoCliente430 && ultimoCliente430.codigoCliente) {
          nuevoCodigo = String(Number(ultimoCliente430.codigoCliente) + 1);
        }
        
        datosCliente.codigoCliente = nuevoCodigo;
      }
      
      // Crear el cliente
      const nuevoCliente = new Cliente(datosCliente);
      const clienteGuardado = await nuevoCliente.save();
      
      res.status(201).json(clienteGuardado);
    } catch (error) {
      console.error('Error al crear cliente:', error);
      res.status(400).json({ error: error.message });
    }
  },
  
  async actualizar(req, res) {
    try {
      const { id } = req.params;
      const datosActualizados = req.body;
      
      const clienteActualizado = await Cliente.findByIdAndUpdate(
        id,
        datosActualizados,
        { new: true }
      );
      
      if (!clienteActualizado) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.json(clienteActualizado);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      res.status(400).json({ error: error.message });
    }
  },
  
  async eliminar(req, res) {
    try {
      const { id } = req.params;
      const clienteEliminado = await Cliente.findByIdAndDelete(id);
      
      if (!clienteEliminado) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  async buscarCoincidencias(req, res) {
    try {
      const { criterios } = req.body;
      
      if (!criterios || !Array.isArray(criterios) || criterios.length === 0) {
        return res.status(400).json({ error: 'Se requieren criterios de búsqueda' });
      }
      
      // Construir consulta con todos los criterios en $or
      const query = { $or: criterios };
      
      const clientesCoincidentes = await Cliente.find(query);
      
      res.json(clientesCoincidentes);
    } catch (error) {
      console.error('Error al buscar coincidencias de clientes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Método para importar clientes desde archivo Excel/CSV
  async importarClientes(req, res) {
    try {
      const { clientes } = req.body;
      
      if (!clientes || !Array.isArray(clientes) || clientes.length === 0) {
        return res.status(400).json({ 
          ok: false,
          error: 'No se recibieron datos de clientes para importar' 
        });
      }
      
      console.log(`[IMPORTAR CLIENTES] Recibidos ${clientes.length} registros`);
      
      // Los datos ya vienen mapeados desde el frontend con los nombres de campo correctos
      // Solo verificamos si los campos existen y asignamos valores por defecto si es necesario
      const clientesMapeados = clientes.map(cliente => {
        // Crear una copia del objeto para no modificar el original
        const clienteMapeado = { ...cliente };
        
        // Verificar y mapear campos adicionales que podrían venir con nombres originales del Excel
        // Intentar obtener valores de campos que podrían no haber sido mapeados correctamente
        if (!clienteMapeado.codigoSage && (cliente['Código'] || cliente['Codigo'] || cliente['codigo'] || cliente['NumCliente'])) {
          clienteMapeado.codigoSage = cliente['Código'] || cliente['Codigo'] || cliente['codigo'] || cliente['NumCliente'];
        }
        
        if (!clienteMapeado.nif && (cliente['Nif'] || cliente['NIF'] || cliente['CIF'] || cliente['cif'])) {
          clienteMapeado.nif = cliente['Nif'] || cliente['NIF'] || cliente['CIF'] || cliente['cif'];
        }
        
        if (!clienteMapeado.razonSocial && (cliente['Razón social'] || cliente['Razon social'] || cliente['RazonSocial'])) {
          clienteMapeado.razonSocial = cliente['Razón social'] || cliente['Razon social'] || cliente['RazonSocial'];
        }
        
        if (!clienteMapeado.razonComercial && (cliente['Razón comercial'] || cliente['Razon comercial'] || cliente['NomComercial'])) {
          clienteMapeado.razonComercial = cliente['Razón comercial'] || cliente['Razon comercial'] || cliente['NomComercial'];
        }

        // Si no hay nombre pero hay razón social, usar razón social como nombre
        if (!clienteMapeado.nombre && clienteMapeado.razonSocial) {
          clienteMapeado.nombre = clienteMapeado.razonSocial;
        }
        
        return clienteMapeado;
      });
      
      const resultado = {
        total: clientesMapeados.length,
        creados: 0,
        actualizados: 0,
        errores: 0,
        clientesConError: []
      };
      
      // Procesar cada cliente
      for (const clienteDatos of clientesMapeados) {
        try {
          // Si tiene código SAGE, intentar buscar primero por ese código
          let clienteExistente = null;

          if (clienteDatos.codigoSage) {
            clienteExistente = await Cliente.findOne({ codigoSage: clienteDatos.codigoSage });
          }

          // Si no se encontró por código SAGE y tiene NIF, buscar por NIF
          if (!clienteExistente && clienteDatos.nif) {
            clienteExistente = await Cliente.findOne({ nif: clienteDatos.nif });
          }

          // Si no se encontró por NIF y tiene email, buscar por email
          if (!clienteExistente && clienteDatos.email) {
            clienteExistente = await Cliente.findOne({ email: clienteDatos.email });
          }

          // Registro detallado para depuración
          console.log(`[IMPORT DEBUG] Procesando cliente: ${clienteDatos.nombre || 'Sin nombre'}`);
          console.log(`[IMPORT DEBUG] Campos encontrados:`, Object.keys(clienteDatos));

          // Si el cliente existe, actualizar sus datos
          if (clienteExistente) {
            await Cliente.findByIdAndUpdate(clienteExistente._id, clienteDatos);
            resultado.actualizados++;
          } else {
            // Si no existe, crear un nuevo cliente
            const nuevoCliente = new Cliente(clienteDatos);
            await nuevoCliente.save();
            resultado.creados++;
          }
        } catch (error) {
          console.error(`Error procesando cliente ${clienteDatos.nombre}:`, error);
          resultado.errores++;
          resultado.clientesConError.push({
            datos: clienteDatos,
            error: error.message
          });
        }
      }
      
      res.json({
        ok: true,
        mensaje: `Importación completada: ${resultado.creados} creados, ${resultado.actualizados} actualizados, ${resultado.errores} errores`,
        resultado
      });
    } catch (error) {
      console.error('Error en importación de clientes:', error);
      res.status(500).json({ 
        ok: false,
        error: error.message 
      });
    }
  },

  // Método para borrar todos los clientes de la base de datos
  async borrarTodosLosClientes(req, res) {
    try {
      console.log('[BORRAR CLIENTES] Iniciando eliminación de todos los clientes...');
      
      // Contar clientes antes del borrado
      const totalAntes = await Cliente.countDocuments();
      console.log(`[BORRAR CLIENTES] Clientes encontrados: ${totalAntes}`);
      
      // Borrar todos los clientes
      const resultado = await Cliente.deleteMany({});
      
      console.log(`[BORRAR CLIENTES] Clientes eliminados: ${resultado.deletedCount}`);
      
      res.json({
        ok: true,
        mensaje: `Se han eliminado ${resultado.deletedCount} clientes de la base de datos`,
        clientesEliminados: resultado.deletedCount,
        totalAnterior: totalAntes
      });
      
    } catch (error) {
      console.error('[BORRAR CLIENTES] Error:', error);
      res.status(500).json({ 
        ok: false, 
        error: error.message 
      });
    }
  }
};
