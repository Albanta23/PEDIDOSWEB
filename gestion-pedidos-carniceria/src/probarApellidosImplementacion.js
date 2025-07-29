/**
 * Script de pruebas para validar la implementación de apellidos en SAGE50
 * Simula datos de WooCommerce y verifica la correcta separación de apellidos
 */

// Importar solo las funciones que necesitamos, no los controladores completos
const { intentarSepararNombreCompleto } = require('./migrarApellidosClientes');

/**
 * Función auxiliar para separar apellidos (copia de woocommerceController para testing)
 */
function separarNombreApellidos(firstName, lastName) {
  const nombre = firstName ? firstName.trim() : '';
  
  if (!lastName) {
    return {
      nombre,
      primerApellido: '',
      segundoApellido: ''
    };
  }
  
  const apellidos = lastName.trim().split(/\s+/).filter(apellido => apellido.length > 0);
  
  return {
    nombre,
    primerApellido: apellidos[0] || '',
    segundoApellido: apellidos[1] || ''
  };
}

/**
 * Función auxiliar para generar nombres SAGE (copia de sageController para testing)
 */
function generarNombreCompletoSage(cliente, fallbackNombre = 'Cliente') {
  if (!cliente) {
    return fallbackNombre;
  }

  if (cliente.razonSocial && cliente.razonSocial.trim()) {
    return cliente.razonSocial.trim();
  }

  if (cliente.nombre || cliente.primerApellido || cliente.segundoApellido) {
    const partesNombre = [
      cliente.nombre || '',
      cliente.primerApellido || '',
      cliente.segundoApellido || ''
    ].filter(parte => parte.trim().length > 0);
    
    if (partesNombre.length > 0) {
      return partesNombre.join(' ');
    }
  }

  return cliente.nombre || fallbackNombre;
}

/**
 * Casos de prueba para diferentes formatos de nombres
 */
const casosPrueba = [
  // Casos típicos de WooCommerce
  {
    tipo: 'WooCommerce - Nombre y un apellido',
    firstName: 'Juan',
    lastName: 'García',
    esperado: {
      nombre: 'Juan',
      primerApellido: 'García',
      segundoApellido: ''
    }
  },
  {
    tipo: 'WooCommerce - Nombre y dos apellidos',
    firstName: 'María',
    lastName: 'López Martínez',
    esperado: {
      nombre: 'María',
      primerApellido: 'López',
      segundoApellido: 'Martínez'
    }
  },
  {
    tipo: 'WooCommerce - Solo nombre',
    firstName: 'Carlos',
    lastName: '',
    esperado: {
      nombre: 'Carlos',
      primerApellido: '',
      segundoApellido: ''
    }
  },
  {
    tipo: 'WooCommerce - Nombre compuesto',
    firstName: 'Ana María',
    lastName: 'Fernández Ruiz',
    esperado: {
      nombre: 'Ana María',
      primerApellido: 'Fernández',
      segundoApellido: 'Ruiz'
    }
  },
  // Casos para migración de nombres existentes
  {
    tipo: 'Migración - Nombre completo típico',
    nombreCompleto: 'Pedro González Sánchez',
    esperadoMigracion: {
      nombre: 'Pedro',
      primerApellido: 'González',
      segundoApellido: 'Sánchez'
    }
  },
  {
    tipo: 'Migración - Solo nombre y apellido',
    nombreCompleto: 'Laura Jiménez',
    esperadoMigracion: {
      nombre: 'Laura',
      primerApellido: 'Jiménez',
      segundoApellido: ''
    }
  },
  {
    tipo: 'Migración - Nombre muy largo',
    nombreCompleto: 'José María de la Cruz González Pérez',
    esperadoMigracion: {
      nombre: 'José',
      primerApellido: 'González',
      segundoApellido: 'Pérez'
    }
  }
];

/**
 * Ejecuta las pruebas de separación de apellidos
 */
function ejecutarPruebas() {
  console.log('🧪 INICIANDO PRUEBAS DE SEPARACIÓN DE APELLIDOS\n');
  
  let pruebasExitosas = 0;
  let pruebasError = 0;

  // Pruebas de WooCommerce
  console.log('📦 PRUEBAS DE WOOCOMMERCE:');
  console.log('═'.repeat(50));
  
  casosPrueba.filter(caso => caso.firstName !== undefined).forEach((caso, index) => {
    try {
      const resultado = separarNombreApellidos(caso.firstName, caso.lastName);
      const esCorrecta = 
        resultado.nombre === caso.esperado.nombre &&
        resultado.primerApellido === caso.esperado.primerApellido &&
        resultado.segundoApellido === caso.esperado.segundoApellido;

      if (esCorrecta) {
        console.log(`✅ ${caso.tipo}`);
        console.log(`   Input: "${caso.firstName}" + "${caso.lastName}"`);
        console.log(`   Output: "${resultado.nombre}" | "${resultado.primerApellido}" | "${resultado.segundoApellido}"`);
        pruebasExitosas++;
      } else {
        console.log(`❌ ${caso.tipo}`);
        console.log(`   Input: "${caso.firstName}" + "${caso.lastName}"`);
        console.log(`   Esperado: "${caso.esperado.nombre}" | "${caso.esperado.primerApellido}" | "${caso.esperado.segundoApellido}"`);
        console.log(`   Obtenido: "${resultado.nombre}" | "${resultado.primerApellido}" | "${resultado.segundoApellido}"`);
        pruebasError++;
      }
      console.log('');
    } catch (error) {
      console.log(`💥 Error en ${caso.tipo}: ${error.message}`);
      pruebasError++;
    }
  });

  // Pruebas de migración
  console.log('🔄 PRUEBAS DE MIGRACIÓN:');
  console.log('═'.repeat(50));
  
  casosPrueba.filter(caso => caso.nombreCompleto !== undefined).forEach((caso, index) => {
    try {
      const resultado = intentarSepararNombreCompleto(caso.nombreCompleto);
      const esCorrecta = 
        resultado.nombre === caso.esperadoMigracion.nombre &&
        resultado.primerApellido === caso.esperadoMigracion.primerApellido &&
        resultado.segundoApellido === caso.esperadoMigracion.segundoApellido;

      if (esCorrecta) {
        console.log(`✅ ${caso.tipo}`);
        console.log(`   Input: "${caso.nombreCompleto}"`);
        console.log(`   Output: "${resultado.nombre}" | "${resultado.primerApellido}" | "${resultado.segundoApellido}"`);
        pruebasExitosas++;
      } else {
        console.log(`❌ ${caso.tipo}`);
        console.log(`   Input: "${caso.nombreCompleto}"`);
        console.log(`   Esperado: "${caso.esperadoMigracion.nombre}" | "${caso.esperadoMigracion.primerApellido}" | "${caso.esperadoMigracion.segundoApellido}"`);
        console.log(`   Obtenido: "${resultado.nombre}" | "${resultado.primerApellido}" | "${resultado.segundoApellido}"`);
        pruebasError++;
      }
      console.log('');
    } catch (error) {
      console.log(`💥 Error en ${caso.tipo}: ${error.message}`);
      pruebasError++;
    }
  });

  // Pruebas de generación de nombres para SAGE
  console.log('🏢 PRUEBAS DE GENERACIÓN SAGE50:');
  console.log('═'.repeat(50));
  
  const clientesPrueba = [
    {
      nombre: 'Juan',
      primerApellido: 'García',
      segundoApellido: 'López',
      esperado: 'Juan García López'
    },
    {
      nombre: 'María',
      primerApellido: 'Fernández',
      segundoApellido: '',
      esperado: 'María Fernández'
    },
    {
      razonSocial: 'Empresa SA',
      nombre: 'Juan',
      primerApellido: 'García',
      esperado: 'Empresa SA'
    },
    {
      nombre: '',
      primerApellido: 'Solo',
      segundoApellido: 'Apellidos',
      esperado: 'Solo Apellidos'
    }
  ];

  clientesPrueba.forEach((cliente, index) => {
    try {
      const resultado = generarNombreCompletoSage(cliente, 'Cliente Fallback');
      const esCorrecta = resultado === cliente.esperado;

      if (esCorrecta) {
        console.log(`✅ Caso ${index + 1} - Correcto`);
        console.log(`   Cliente: ${JSON.stringify(cliente)}`);
        console.log(`   Output: "${resultado}"`);
        pruebasExitosas++;
      } else {
        console.log(`❌ Caso ${index + 1} - Error`);
        console.log(`   Cliente: ${JSON.stringify(cliente)}`);
        console.log(`   Esperado: "${cliente.esperado}"`);
        console.log(`   Obtenido: "${resultado}"`);
        pruebasError++;
      }
      console.log('');
    } catch (error) {
      console.log(`💥 Error en caso ${index + 1}: ${error.message}`);
      pruebasError++;
    }
  });

  // Resumen final
  console.log('📊 RESUMEN DE PRUEBAS:');
  console.log('═'.repeat(50));
  console.log(`✅ Pruebas exitosas: ${pruebasExitosas}`);
  console.log(`❌ Pruebas con errores: ${pruebasError}`);
  console.log(`📈 Total: ${pruebasExitosas + pruebasError}`);
  console.log(`📊 Éxito: ${((pruebasExitosas / (pruebasExitosas + pruebasError)) * 100).toFixed(1)}%`);

  if (pruebasError === 0) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON CORRECTAMENTE!');
  } else {
    console.log(`\n⚠️  Se encontraron ${pruebasError} errores en las pruebas.`);
  }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
  ejecutarPruebas();
}

module.exports = {
  ejecutarPruebas,
  casosPrueba
};
