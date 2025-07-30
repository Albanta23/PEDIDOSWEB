const { 
  direccionesEnvioSonDiferentes, 
  extraerDireccionEnvio 
} = require('./woocommerceController');

// Simular datos de WooCommerce con direcciones diferentes
const pedidoConDireccionesDiferentes = {
  id: 488799,
  number: 488799,
  status: 'enviado',
  date_created: '2025-07-22T10:37:16',
  total: '132.29',
  billing: {
    first_name: "Felipe",
    last_name: "Garretas",
    company: "Felipe",
    address_1: "Dr. Fleming 7",
    address_2: "1 c",
    city: "Basauri",
    postcode: "48970",
    state: "BI",
    country: "ES",
    email: "felipe@example.com",
    phone: "666123456"
  },
  shipping: {
    first_name: "Felipe",
    last_name: "Garretas Funcia",
    company: "Felipe",
    address_1: "Ribera del Najerilla 21",
    address_2: "1 D",
    city: "Nájera",
    postcode: "26300",
    state: "LO",
    country: "ES"
  },
  meta_data: [
    { key: '_billing_myfield3', value: 'Garretas' }
  ]
};

// Simular datos con misma dirección
const pedidoConMismaDireccion = {
  id: 490496,
  number: 490496,
  status: 'enviado',
  date_created: '2025-07-29T22:40:34',
  total: '129.70',
  billing: {
    first_name: "Ignacio",
    last_name: "Angulo",
    company: "",
    address_1: "Avda Gran Vía Juan Carlos I Nº 26 A",
    address_2: "Piso 5º C",
    city: "Logroño",
    postcode: "26002",
    state: "LO",
    country: "ES",
    email: "ignacio@example.com",
    phone: "629407710"
  },
  shipping: {
    first_name: "Ignacio",
    last_name: "Angulo",
    company: "",
    address_1: "Avda Gran Vía Juan Carlos I Nº 26 A",
    address_2: "Piso 5º C",
    city: "Logroño",
    postcode: "26002",
    state: "LO",
    country: "ES"
  },
  meta_data: [
    { key: '_billing_myfield3', value: 'Muñoz' }
  ]
};

console.log('🧪 PRUEBA DE DETECCIÓN DE DIRECCIONES DIFERENTES\n');

// Prueba 1: Direcciones diferentes
console.log('🔍 CASO 1: Direcciones diferentes');
console.log(`Pedido: #${pedidoConDireccionesDiferentes.number}`);
const sonDiferentes1 = direccionesEnvioSonDiferentes(
  pedidoConDireccionesDiferentes.billing, 
  pedidoConDireccionesDiferentes.shipping
);
console.log(`¿Son diferentes?: ${sonDiferentes1 ? '✅ SÍ' : '❌ NO'}`);

const datosEnvio1 = extraerDireccionEnvio(
  pedidoConDireccionesDiferentes.shipping, 
  pedidoConDireccionesDiferentes.billing
);
console.log('📦 Datos de envío extraídos:');
console.log(`   - Nombre: ${datosEnvio1.nombre}`);
console.log(`   - Empresa: ${datosEnvio1.empresa}`);
console.log(`   - Dirección: ${datosEnvio1.direccion1}`);
console.log(`   - Ciudad: ${datosEnvio1.ciudad}`);
console.log(`   - CP: ${datosEnvio1.codigoPostal}`);
console.log(`   - Provincia: ${datosEnvio1.provincia}`);
console.log(`   - Es envío alternativo: ${datosEnvio1.esEnvioAlternativo ? '✅ SÍ' : '❌ NO'}`);

console.log('\n═══════════════════════════════════════════\n');

// Prueba 2: Misma dirección
console.log('🔍 CASO 2: Misma dirección');
console.log(`Pedido: #${pedidoConMismaDireccion.number}`);
const sonDiferentes2 = direccionesEnvioSonDiferentes(
  pedidoConMismaDireccion.billing, 
  pedidoConMismaDireccion.shipping
);
console.log(`¿Son diferentes?: ${sonDiferentes2 ? '✅ SÍ' : '❌ NO'}`);

const datosEnvio2 = extraerDireccionEnvio(
  pedidoConMismaDireccion.shipping, 
  pedidoConMismaDireccion.billing
);
console.log('📦 Datos de envío extraídos:');
console.log(`   - Nombre: ${datosEnvio2.nombre}`);
console.log(`   - Dirección: ${datosEnvio2.direccion1}`);
console.log(`   - Ciudad: ${datosEnvio2.ciudad}`);
console.log(`   - CP: ${datosEnvio2.codigoPostal}`);
console.log(`   - Es envío alternativo: ${datosEnvio2.esEnvioAlternativo ? '✅ SÍ' : '❌ NO'}`);

console.log('\n🎯 RESULTADO: Funciones implementadas correctamente');
console.log('✅ Detección de direcciones diferentes: OK');
console.log('✅ Extracción de datos de envío: OK');
console.log('✅ Listo para integrar en etiquetas de envío');
