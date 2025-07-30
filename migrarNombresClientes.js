/**
 * Script para migrar nombres de clientes SAGE50 a formato con apellidos separados
 * Soluciona el problema de pérdida de apellidos tras implementación WooCommerce
 */

const mongoose = require('mongoose');
const Cliente = require('./gestion-pedidos-carniceria/src/models/Cliente');

// Funciones utilitarias (versión Node.js de clienteUtils.js)
const separarNombreCompleto = (nombreCompleto) => {
  if (!nombreCompleto || typeof nombreCompleto !== 'string') {
    return { nombre: '', primerApellido: '', segundoApellido: '' };
  }
  
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 1) {
    return {
      nombre: partes[0],
      primerApellido: '',
      segundoApellido: ''
    };
  } else if (partes.length === 2) {
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: ''
    };
  } else if (partes.length >= 3) {
    return {
      nombre: partes[0],
      primerApellido: partes[1],
      segundoApellido: partes.slice(2).join(' ')
    };
  }
  
  return { nombre: '', primerApellido: '', segundoApellido: '' };
};

const esNombreEmpresa = (nombre) => {
  if (!nombre) return false;
  
  const indicadoresEmpresa = [
    'S.L.', 'S.A.', 'SL', 'SA', 'SLU', 'SOCIEDAD', 'EMPRESA', 'COMERCIAL',
    'INDUSTRIAS', 'DISTRIBUCIONES', 'SERVICIOS', 'GRUPO', 'CORPORACION',
    'FUNDACION', 'ASOCIACION', 'COOPERATIVA', 'COOP', 'LTD', 'LIMITED',
    'RESTAURANT', 'BAR', 'HOTEL', 'CAFÉ', 'CAFETERIA', 'PANADERIA',
    'CARNICERIA', 'CHARCUTERIA', 'SUPERMERCADO', 'TIENDA'
  ];
  
  const nombreUpper = nombre.toUpperCase();
  return indicadoresEmpresa.some(indicador => nombreUpper.includes(indicador));
};

const migrarNombresClientes = async () => {
  try {
    console.log('🚀 Iniciando migración de nombres de clientes...');
    
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dbjavier:Albanta2025@cluster0.e16j9g4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar clientes que necesitan migración
    const clientesParaMigrar = await Cliente.find({
      nombre: { $exists: true, $ne: '' },
      $and: [
        {
          $or: [
            { primerApellido: { $exists: false } },
            { primerApellido: '' },
            { primerApellido: null }
          ]
        },
        {
          $or: [
            { segundoApellido: { $exists: false } },
            { segundoApellido: '' },
            { segundoApellido: null }
          ]
        }
      ]
    });
    
    console.log(`📊 Encontrados ${clientesParaMigrar.length} clientes para migrar`);
    
    if (clientesParaMigrar.length === 0) {
      console.log('✅ No hay clientes que requieran migración');
      return;
    }
    
    let migrados = 0;
    let empresas = 0;
    let errores = 0;
    
    // Procesar cada cliente
    for (const cliente of clientesParaMigrar) {
      try {
        const nombreOriginal = cliente.nombre;
        
        // Verificar si es una empresa
        if (esNombreEmpresa(nombreOriginal)) {
          console.log(`🏢 EMPRESA detectada: "${nombreOriginal}" - manteniendo como está`);
          empresas++;
          continue;
        }
        
        // Solo migrar si el nombre contiene espacios (probables apellidos)
        if (!nombreOriginal.includes(' ')) {
          console.log(`👤 NOMBRE SIMPLE: "${nombreOriginal}" - manteniendo como está`);
          continue;
        }
        
        // Separar el nombre completo
        const partesNombre = separarNombreCompleto(nombreOriginal);
        
        // Solo actualizar si realmente hay apellidos para extraer
        if (partesNombre.primerApellido || partesNombre.segundoApellido) {
          await Cliente.findByIdAndUpdate(cliente._id, {
            nombre: partesNombre.nombre,
            primerApellido: partesNombre.primerApellido,
            segundoApellido: partesNombre.segundoApellido
          });
          
          console.log(`✅ MIGRADO: "${nombreOriginal}" → Nombre: "${partesNombre.nombre}", 1º Apellido: "${partesNombre.primerApellido}", 2º Apellido: "${partesNombre.segundoApellido}"`);
          migrados++;
        }
        
      } catch (error) {
        console.error(`❌ Error migrando cliente ${cliente._id}:`, error.message);
        errores++;
      }
    }
    
    console.log('\n📈 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Clientes migrados: ${migrados}`);
    console.log(`🏢 Empresas detectadas (sin cambios): ${empresas}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`📊 Total procesados: ${clientesParaMigrar.length}`);
    
    // Verificar algunos resultados
    console.log('\n🔍 VERIFICACIÓN - Algunos clientes migrados:');
    const clientesMigrados = await Cliente.find({
      $or: [
        { primerApellido: { $exists: true, $ne: '' } },
        { segundoApellido: { $exists: true, $ne: '' } }
      ]
    }).limit(5);
    
    clientesMigrados.forEach(cliente => {
      const nombreCompleto = [cliente.nombre, cliente.primerApellido, cliente.segundoApellido]
        .filter(parte => parte && parte.trim())
        .join(' ');
      console.log(`   - ${nombreCompleto} (Código: ${cliente.codigoSage || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Función para deshacer la migración (por si algo sale mal)
const deshacerMigracion = async () => {
  try {
    console.log('🔄 Iniciando proceso de deshacer migración...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://dbjavier:Albanta2025@cluster0.e16j9g4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');
    
    const clientesConApellidos = await Cliente.find({
      $or: [
        { primerApellido: { $exists: true, $ne: '' } },
        { segundoApellido: { $exists: true, $ne: '' } }
      ]
    });
    
    console.log(`📊 Encontrados ${clientesConApellidos.length} clientes con apellidos separados`);
    
    let restaurados = 0;
    
    for (const cliente of clientesConApellidos) {
      try {
        const nombreCompleto = [cliente.nombre, cliente.primerApellido, cliente.segundoApellido]
          .filter(parte => parte && parte.trim())
          .join(' ');
        
        await Cliente.findByIdAndUpdate(cliente._id, {
          nombre: nombreCompleto,
          $unset: {
            primerApellido: 1,
            segundoApellido: 1
          }
        });
        
        console.log(`✅ RESTAURADO: "${nombreCompleto}"`);
        restaurados++;
        
      } catch (error) {
        console.error(`❌ Error restaurando cliente ${cliente._id}:`, error.message);
      }
    }
    
    console.log(`\n📈 Restauración completada: ${restaurados} clientes`);
    
  } catch (error) {
    console.error('❌ Error en la restauración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
};

// Función principal
const main = async () => {
  const accion = process.argv[2];
  
  if (accion === '--deshacer') {
    await deshacerMigracion();
  } else if (accion === '--migrar' || !accion) {
    await migrarNombresClientes();
  } else {
    console.log('❓ Uso:');
    console.log('  node migrarNombresClientes.js --migrar   (migrar nombres a apellidos separados)');
    console.log('  node migrarNombresClientes.js --deshacer (deshacer migración)');
  }
};

// Exportar funciones para uso como módulo
module.exports = {
  migrarNombresClientes,
  deshacerMigracion,
  separarNombreCompleto,
  esNombreEmpresa
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(console.error);
}
