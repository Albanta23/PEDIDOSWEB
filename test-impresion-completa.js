const fs = require('fs');
const path = require('path');

// Simular la importación del ticketGenerator
const ticketGeneratorPath = path.join(__dirname, 'src/utils/ticketGenerator.js');
const ticketGeneratorCode = fs.readFileSync(ticketGeneratorPath, 'utf8');

// Simular DATOS_EMPRESA
const DATOS_EMPRESA = {
  nombre: "CARNICERÍA LOS PINOS",
  direccion: "Calle Principal 123, 28001 Madrid",
  telefono: "912 345 678",
  web: "www.carnicerialospinos.com"
};

// Evaluar el código para poder usar las funciones
const modifiedCode = ticketGeneratorCode.replace(
  "import { DATOS_EMPRESA } from '../configDatosEmpresa';",
  `const DATOS_EMPRESA = ${JSON.stringify(DATOS_EMPRESA)};`
);

eval(modifiedCode);

// Datos de prueba
const pedidoPrueba = {
  _id: "TEST123",
  numeroPedido: "P-2025-001",
  clienteNombre: "Juan Pérez García",
  direccion: "Avenida de la Constitución 45, 3º B",
  codigoPostal: "28012",
  poblacion: "Madrid",
  telefono: "666 123 456",
  estado: "Preparado",
  notasCliente: "Entregar por la mañana, preferiblemente antes de las 10:00",
  lineas: [
    {
      producto: { nombre: "Lomo Ibérico", unidad: "kg" },
      cantidad: 2.5,
      precio: 18.90,
      lote: "LI250128A"
    },
    {
      producto: { nombre: "Chorizo Casero", unidad: "kg" },
      cantidad: 1.0,
      precio: 12.50,
      lote: "CC250127B"
    },
    {
      producto: { nombre: "Jamón Serrano", unidad: "kg" },
      cantidad: 0.8,
      precio: 24.00,
      lote: "JS250126C"
    }
  ],
  subtotal: 78.15,
  iva: 8.20,
  total: 86.35
};

console.log('🧪 PRUEBA DEL SISTEMA DE IMPRESIÓN COMPLETO');
console.log('============================================\n');

try {
  // 1. Generar ticket de texto profesional (Epson TM-T70II)
  console.log('📄 1. Generando ticket profesional para Epson TM-T70II...');
  const ticketTexto = generarTicketTexto(pedidoPrueba, 'Juan Operario');
  
  // Guardar para inspección
  fs.writeFileSync('ticket-epson-prueba.html', ticketTexto);
  console.log('   ✅ Ticket profesional generado → ticket-epson-prueba.html');
  
  // 2. Generar etiquetas térmicas (Zebra GK420d)
  console.log('\n🏷️  2. Generando etiquetas térmicas para Zebra GK420d...');
  const numBultos = 3;
  
  for (let i = 1; i <= numBultos; i++) {
    const etiquetaTermica = generarEtiquetaTermica(pedidoPrueba, i, numBultos);
    fs.writeFileSync(`etiqueta-zebra-bulto${i}-prueba.html`, etiquetaTermica);
    console.log(`   ✅ Etiqueta bulto ${i}/${numBultos} generada → etiqueta-zebra-bulto${i}-prueba.html`);
  }
  
  console.log('\n📊 RESUMEN DEL FLUJO DE IMPRESIÓN:');
  console.log('================================');
  console.log(`🎫 1 ticket profesional (texto) para Epson TM-T70II`);
  console.log(`🏷️  ${numBultos} etiquetas térmicas para Zebra GK420d`);
  console.log(`⚡ Todas las ventanas se abrirán SIMULTÁNEAMENTE`);
  console.log(`🖨️  Impresión automática activada para todas`);
  
  console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE');
  console.log('\nArchivos generados:');
  console.log('- ticket-epson-prueba.html');
  for (let i = 1; i <= numBultos; i++) {
    console.log(`- etiqueta-zebra-bulto${i}-prueba.html`);
  }
  
} catch (error) {
  console.error('❌ ERROR en la prueba:', error.message);
  console.error(error.stack);
}
