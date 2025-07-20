/**
 * Servicio para gestionar clientes
 * Proporciona métodos para listar, crear, actualizar, eliminar e importar clientes
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10001';

/**
 * Servicio para gestionar operaciones relacionadas con clientes
 */
const clientesService = {
  /**
   * Obtiene la lista de todos los clientes
   * @returns {Promise<Array>} Lista de clientes
   */
  listarClientes: async () => {
    try {
      const response = await fetch(`${API_URL}/api/clientes`);
      if (!response.ok) {
        throw new Error(`Error al obtener clientes: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en listarClientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene un cliente por su ID
   * @param {string} id - ID del cliente a buscar
   * @returns {Promise<Object>} Datos del cliente
   */
  obtenerClientePorId: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/${id}`);
      if (!response.ok) {
        throw new Error(`Error al obtener cliente: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en obtenerClientePorId:', error);
      throw error;
    }
  },

  /**
   * Crea un nuevo cliente
   * @param {Object} cliente - Datos del cliente a crear
   * @returns {Promise<Object>} Cliente creado
   */
  crearCliente: async (cliente) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
      });
      if (!response.ok) {
        throw new Error(`Error al crear cliente: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en crearCliente:', error);
      throw error;
    }
  },

  /**
   * Actualiza un cliente existente
   * @param {string} id - ID del cliente a actualizar
   * @param {Object} cliente - Nuevos datos del cliente
   * @returns {Promise<Object>} Cliente actualizado
   */
  actualizarCliente: async (id, cliente) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cliente),
      });
      if (!response.ok) {
        throw new Error(`Error al actualizar cliente: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en actualizarCliente:', error);
      throw error;
    }
  },

  /**
   * Elimina un cliente
   * @param {string} id - ID del cliente a eliminar
   * @returns {Promise<Object>} Respuesta de la operación
   */
  eliminarCliente: async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar cliente: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en eliminarCliente:', error);
      throw error;
    }
  },

  /**
   * Busca clientes que coincidan con los criterios especificados
   * @param {Object} criterios - Criterios de búsqueda
   * @returns {Promise<Array>} Lista de clientes que coinciden
   */
  buscarClientes: async (criterios) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/buscar-coincidencias`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(criterios),
      });
      if (!response.ok) {
        throw new Error(`Error al buscar clientes: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en buscarClientes:', error);
      throw error;
    }
  },

  /**
   * Importa una lista de clientes desde un archivo
   * @param {Array} clientes - Lista de clientes a importar
   * @returns {Promise<Object>} Resultado de la importación
   */
  importarClientes: async (clientes) => {
    try {
      console.log(`[clientesService] Enviando ${clientes.length} clientes al servidor`);
      
      const response = await fetch(`${API_URL}/api/clientes/importar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientes }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[clientesService] Error en respuesta del servidor:', response.status, errorData);
        throw new Error(`Error al importar clientes: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[clientesService] Respuesta de importación:', result);
      return result;
    } catch (error) {
      console.error('[clientesService] Error en importarClientes:', error);
      throw error;
    }
  },
  
  /**
   * Elimina todos los clientes (¡USAR CON PRECAUCIÓN!)
   * @returns {Promise<Object>} Resultado de la operación
   */
  eliminarTodosClientes: async () => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/borrar-todos`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error(`Error al eliminar todos los clientes: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en eliminarTodosClientes:', error);
      throw error;
    }
  },
  
  /**
   * Limpia clientes duplicados en la base de datos
   * @param {boolean} ejecutar - Si es true, ejecuta la limpieza. Si es false, solo simula.
   * @returns {Promise<Object>} Resultado de la operación
   */
  limpiarDuplicados: async (ejecutar = false) => {
    try {
      const response = await fetch(`${API_URL}/api/clientes/limpiar-duplicados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ejecutar }),
      });
      if (!response.ok) {
        throw new Error(`Error al limpiar duplicados: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en limpiarDuplicados:', error);
      throw error;
    }
  }
};

export default clientesService;
