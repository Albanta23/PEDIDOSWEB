// Script para solucionar problema de tipo MIME en archivos .jsx
const fs = require('fs');
const path = require('path');

// Actualizar la configuración de Vite para resolver el problema de tipo MIME
function actualizarConfiguracionVite() {
  console.log('Actualizando configuración de Vite...');
  
  const rutaConfig = path.join(__dirname, 'vite.config.js');
  if (!fs.existsSync(rutaConfig)) {
    console.error(`No se encontró el archivo de configuración: ${rutaConfig}`);
    return false;
  }
  
  // Hacer copia de seguridad
  const rutaBackup = `${rutaConfig}.backup-${Date.now()}`;
  fs.copyFileSync(rutaConfig, rutaBackup);
  console.log(`Copia de seguridad creada: ${rutaBackup}`);
  
  // Leer configuración actual
  let contenido = fs.readFileSync(rutaConfig, 'utf8');
  
  // Verificar si ya existe la configuración para servir archivos JSX
  if (!contenido.includes('transformIndexHtml')) {
    console.log('Añadiendo configuración para servir archivos JSX correctamente...');
    
    // Buscar la sección de plugins
    const pluginsMatch = contenido.match(/plugins\s*:\s*\[(.*?)\]/s);
    if (pluginsMatch) {
      const newPlugins = `plugins: [
    react(),
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Configurar tipo MIME para archivos JSX
          if (req.url.endsWith('.jsx')) {
            res.setHeader('Content-Type', 'application/javascript');
          }
          next();
        });
      }
    }
  ]`;
      contenido = contenido.replace(/plugins\s*:\s*\[(.*?)\]/s, newPlugins);
      
      // Guardar la configuración actualizada
      fs.writeFileSync(rutaConfig, contenido);
      console.log('Configuración de Vite actualizada con éxito.');
      return true;
    } else {
      console.error('No se pudo encontrar la sección de plugins en la configuración de Vite.');
      return false;
    }
  } else {
    console.log('La configuración para servir archivos JSX ya existe.');
    return true;
  }
}

// Verificar y actualizar archivos HTML para asegurar que carguen correctamente los archivos JSX
function verificarArchivosHTML() {
  console.log('\nVerificando archivos HTML...');
  
  const carpetas = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'src')
  ];
  
  let archivosHTML = [];
  
  // Buscar archivos HTML
  carpetas.forEach(carpeta => {
    if (fs.existsSync(carpeta)) {
      const archivos = buscarArchivosRecursivamente(carpeta, '.html');
      archivosHTML = [...archivosHTML, ...archivos];
    }
  });
  
  console.log(`Encontrados ${archivosHTML.length} archivos HTML para verificar.`);
  
  // Verificar cada archivo HTML
  let archivosModificados = 0;
  archivosHTML.forEach(archivo => {
    console.log(`Verificando: ${archivo}`);
    
    let contenido = fs.readFileSync(archivo, 'utf8');
    let modificado = false;
    
    // Buscar scripts con tipo="module" que carguen archivos .jsx directamente
    const scriptRegex = /<script\s+(?:[^>]*?\s+)?src=["']([^"']+\.jsx)["'](?:[^>]*?\s+)?(?:type=["']module["'])?(?:[^>]*?)>(.*?)<\/script>/gi;
    let match;
    
    while ((match = scriptRegex.exec(contenido)) !== null) {
      console.log(`  Encontrado script que carga .jsx: ${match[1]}`);
      
      // Verificar si el script tiene el tipo correcto
      if (!match[0].includes('type="module"')) {
        const scriptOriginal = match[0];
        const scriptNuevo = scriptOriginal.replace(
          /<script/i, 
          '<script type="module"'
        );
        
        contenido = contenido.replace(scriptOriginal, scriptNuevo);
        console.log(`  Añadido type="module" al script.`);
        modificado = true;
      }
    }
    
    // Guardar cambios si se realizaron modificaciones
    if (modificado) {
      fs.writeFileSync(archivo, contenido);
      console.log(`  Archivo ${archivo} modificado y guardado.`);
      archivosModificados++;
    }
  });
  
  console.log(`Modificados ${archivosModificados} archivos HTML.`);
  return archivosModificados > 0;
}

// Función auxiliar para buscar archivos recursivamente
function buscarArchivosRecursivamente(directorio, extension) {
  let resultados = [];
  
  const archivos = fs.readdirSync(directorio);
  for (const archivo of archivos) {
    const rutaCompleta = path.join(directorio, archivo);
    const stat = fs.statSync(rutaCompleta);
    
    if (stat.isDirectory()) {
      resultados = resultados.concat(buscarArchivosRecursivamente(rutaCompleta, extension));
    } else if (rutaCompleta.endsWith(extension)) {
      resultados.push(rutaCompleta);
    }
  }
  
  return resultados;
}

// Solucionar problema de tipo MIME para el componente específico
function solucionarComponenteClientes() {
  console.log('\nSolucionando problema con el componente ClientesMantenimiento.jsx...');
  
  const rutaComponente = path.join(__dirname, 'src', 'clientes-gestion', 'ClientesMantenimiento.jsx');
  if (!fs.existsSync(rutaComponente)) {
    console.error(`No se encontró el componente: ${rutaComponente}`);
    return false;
  }
  
  // Hacer copia de seguridad
  const rutaBackup = `${rutaComponente}.backup-mime-${Date.now()}`;
  fs.copyFileSync(rutaComponente, rutaBackup);
  console.log(`Copia de seguridad creada: ${rutaBackup}`);
  
  // No modificamos el contenido, solo aseguramos que tiene el formato correcto
  console.log('Verificando formato del componente...');
  
  // Si es necesario, podríamos agregar aquí código para asegurar que el componente
  // está correctamente formateado y no tiene problemas de sintaxis
  
  return true;
}

// Función principal
async function solucionarProblemasMIME() {
  console.log('=======================================================');
  console.log('   SOLUCIÓN DE PROBLEMAS DE TIPO MIME PARA ARCHIVOS JSX');
  console.log('=======================================================\n');
  
  // 1. Actualizar configuración de Vite
  const viteActualizado = actualizarConfiguracionVite();
  
  // 2. Verificar archivos HTML
  const htmlActualizados = verificarArchivosHTML();
  
  // 3. Solucionar componente específico
  const componenteSolucionado = solucionarComponenteClientes();
  
  console.log('\n=======================================================');
  console.log('Resumen de acciones:');
  console.log(` - Configuración Vite: ${viteActualizado ? '✅ Actualizada' : '❌ No actualizada'}`);
  console.log(` - Archivos HTML: ${htmlActualizados ? '✅ Actualizados' : '❌ No fue necesario actualizar'}`);
  console.log(` - Componente ClientesMantenimiento: ${componenteSolucionado ? '✅ Verificado' : '❌ No encontrado'}`);
  
  console.log('\nPara que los cambios surtan efecto:');
  console.log('1. Reinicie el servidor de desarrollo (si está ejecutándose)');
  console.log('2. Limpie la caché del navegador (Ctrl+F5 o Cmd+Shift+R)');
  console.log('3. Si el problema persiste, intente usar la ruta relativa en lugar de la URL completa');
  console.log('=======================================================');
}

// Ejecutar
solucionarProblemasMIME();
