import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '');

/**
 * Servicio para obtener datos de SAGE50 (vendedores, formas de pago, etc.)
 */
class SageDataService {
  
  /**
   * Obtiene la lista de vendedores desde SAGE50
   */
  static async obtenerVendedores() {
    try {
      const response = await axios.get(`${API_URL}/vendedores`);
      return response.data;
    } catch (error) {
      console.warn('Error al obtener vendedores de SAGE50, usando datos por defecto:', error);
      // Datos de fallback
      return [
        { _id: '1', codigo: '01', nombre: 'VENDEDOR PRINCIPAL', activo: true },
        { _id: '2', codigo: '02', nombre: 'TIENDA ONLINE', activo: true },
        { _id: '3', codigo: '03', nombre: 'MOSTRADOR', activo: true },
        { _id: '4', codigo: '04', nombre: 'TELEFONO', activo: true },
        { _id: '5', codigo: '05', nombre: 'WHATSAPP', activo: true }
      ];
    }
  }

  /**
   * Obtiene la lista de almacenes desde SAGE50
   */
  static async obtenerAlmacenes() {
    try {
      const response = await axios.get(`${API_URL}/almacenes`);
      return response.data;
    } catch (error) {
      console.warn('Error al obtener almacenes de SAGE50, usando datos por defecto:', error);
      // Datos de fallback
      return [
        { _id: '1', codigo: '00', nombre: 'ALMACÉN PRINCIPAL', direccion: 'Polígono Industrial, Nave 1', activo: true },
        { _id: '2', codigo: '01', nombre: 'ALMACÉN SECUNDARIO', direccion: 'Calle Comercio, 23', activo: true },
        { _id: '3', codigo: '02', nombre: 'ALMACÉN ZONA NORTE', direccion: 'Avenida Norte, 45', activo: true },
        { _id: '4', codigo: '03', nombre: 'ALMACÉN EXPEDICIONES', direccion: 'Polígono Industrial, Nave 8', activo: true }
      ];
    }
  }
  static async obtenerFormasPago() {
    try {
      const response = await axios.get(`${API_URL}/formas-pago`);
      return response.data;
    } catch (error) {
      console.warn('Error al obtener formas de pago de SAGE50, usando datos por defecto:', error);
      // Datos de fallback basados en el CSV
      return [
        { _id: '1', codigo: 'CO', nombre: 'CONTADO', activo: true },
        { _id: '2', codigo: 'CT', nombre: 'CONTRAREEMBOLSO', activo: true },
        { _id: '3', codigo: 'AD', nombre: 'ADELANTADO', activo: true },
        { _id: '4', codigo: 'PA', nombre: 'PAGARE', activo: true },
        { _id: '5', codigo: 'BI', nombre: 'BIZUM', activo: true },
        { _id: '6', codigo: 'PP', nombre: 'PAYPAL', activo: true },
        { _id: '7', codigo: '81', nombre: 'RECIBO A 10 DIAS F/F', activo: true },
        { _id: '8', codigo: '16', nombre: 'RECIBO 85 DIAS F/F', activo: true }
      ];
    }
  }

  /**
   * Busca un almacén por código
   */
  static async buscarAlmacenPorCodigo(codigo) {
    const almacenes = await this.obtenerAlmacenes();
    return almacenes.find(a => a.codigo === codigo);
  }

  /**
   * Busca un vendedor por código
   */
  static async buscarVendedorPorCodigo(codigo) {
    const vendedores = await this.obtenerVendedores();
    return vendedores.find(v => v.codigo === codigo);
  }

  /**
   * Busca una forma de pago por código
   */
  static async buscarFormaPagoPorCodigo(codigo) {
    const formasPago = await this.obtenerFormasPago();
    return formasPago.find(fp => fp.codigo === codigo);
  }

  /**
   * Busca un almacén por código
   */
  static async buscarAlmacenPorCodigo(codigo) {
    const almacenes = await this.obtenerAlmacenes();
    return almacenes.find(a => a.codigo === codigo);
  }

  /**
   * Obtiene información completa de un almacén para mostrar en el pedido
   */
  static async obtenerInfoAlmacen(almacen) {
    if (!almacen) return null;
    
    // Si es un string, buscar por nombre o código
    if (typeof almacen === 'string') {
      const almacenes = await this.obtenerAlmacenes();
      const almacenEncontrado = almacenes.find(a => 
        a.nombre === almacen || 
        a.codigo === almacen ||
        a.nombre.toLowerCase() === almacen.toLowerCase()
      );
      return almacenEncontrado || { codigo: '99', nombre: almacen, activo: true };
    }
    
    // Si ya es un objeto, devolverlo tal como está
    return almacen;
  }

  /**
   * Obtiene información completa de un vendedor para mostrar en el pedido
   */
  static async obtenerInfoVendedor(vendedor) {
    if (!vendedor) return null;
    
    // Si es un string, buscar por nombre o código
    if (typeof vendedor === 'string') {
      const vendedores = await this.obtenerVendedores();
      const vendedorEncontrado = vendedores.find(v => 
        v.nombre === vendedor || 
        v.codigo === vendedor ||
        v.nombre.toLowerCase() === vendedor.toLowerCase()
      );
      return vendedorEncontrado || { codigo: '99', nombre: vendedor, activo: true };
    }
    
    // Si ya es un objeto, devolverlo tal como está
    return vendedor;
  }

  /**
   * Obtiene información completa de una forma de pago para mostrar en el pedido
   */
  static async obtenerInfoFormaPago(formaPago) {
    if (!formaPago) return null;
    
    // Si es un string, buscar por nombre o código
    if (typeof formaPago === 'string') {
      const formasPago = await this.obtenerFormasPago();
      const formaPagoEncontrada = formasPago.find(fp => 
        fp.nombre === formaPago || 
        fp.codigo === formaPago ||
        fp.nombre.toLowerCase() === formaPago.toLowerCase()
      );
      return formaPagoEncontrada || { codigo: '99', nombre: formaPago, activo: true };
    }
    
    // Si ya es un objeto con código, devolverlo tal como está
    if (formaPago.codigo && formaPago.nombre) {
      return formaPago;
    }
    
    // Si es un objeto WooCommerce, transformarlo
    if (formaPago.titulo || formaPago.metodo) {
      return {
        codigo: formaPago.codigo || '99',
        nombre: formaPago.titulo || formaPago.metodo || 'No especificado',
        metodo: formaPago.metodo,
        activo: true
      };
    }
    
    return formaPago;
  }
}

export default SageDataService;
