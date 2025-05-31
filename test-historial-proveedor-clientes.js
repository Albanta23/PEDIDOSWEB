// test-historial-proveedor-clientes.js
// Script automático para probar el flujo de envío y consulta de historial por tienda
const axios = require('axios');

const BACKEND_URL = 'http://localhost:10001'; // Cambia si usas otro puerto/backend
const TIENDA_ID = 'PEDIDOS_CLIENTES';

async function enviarPedidoPrueba() {
  const pedido = {
    tienda: 'PEDIDOS CLIENTES',
    tiendaId: TIENDA_ID,
    fecha: new Date().toISOString(),
    lineas: [
      { referencia: 'LOMO', cantidad: 2, unidad: 'kg' },
      { referencia: 'PANCETA', cantidad: 1, unidad: 'kg' }
    ]
  };
  const res = await axios.post(`${BACKEND_URL}/api/enviar-proveedor-v2`, pedido);
  console.log('Envío de pedido:', res.data);
}

async function consultarHistorial() {
  const url = `${BACKEND_URL}/api/historial-proveedor?tiendaId=${TIENDA_ID}&periodo=semana`;
  try {
    const res = await axios.get(url);
    console.log('Historial recibido:', res.data.historial);
    if (Array.isArray(res.data.historial)) {
      const otrasTiendas = res.data.historial.filter(p => (p.tienda || '').toUpperCase() !== 'PEDIDOS CLIENTES');
      if (otrasTiendas.length === 0) {
        console.log('✅ Solo aparecen pedidos de PEDIDOS_CLIENTES');
      } else {
        console.error('❌ Aparecen pedidos de otras tiendas:', otrasTiendas.map(p => p.tienda));
      }
    }
  } catch (e) {
    console.error('❌ Error de red o backend al consultar historial:', e.response?.data || e.message);
  }
}

(async () => {
  try {
    await enviarPedidoPrueba();
    // Espera unos segundos para asegurar guardado
    setTimeout(async () => {
      await consultarHistorial();
    }, 2000);
  } catch (e) {
    console.error('Error en la prueba:', e.response?.data || e.message);
  }
})();
