// Solucionar problema específico con la URL del módulo que está dando error MIME
const fs = require('fs');
const path = require('path');

function solucionar() {
  console.log('Buscando referencias a la URL con problemas...');
  
  // URL problemática
  const urlProblematica = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-3100.app.github.dev/ClientesMantenimiento.jsx';
  
  // Buscar en archivos HTML y JS
  const directorios = [
    path.join(__dirname, 'src'),
    path.join(__dirname, 'public')
  ];
  
  // Extensiones a buscar
  const extensiones = ['.html', '.js', '.jsx'];
  
  // Buscar recursivamente en los directorios
  let archivosEncontrados = [];
  directorios.forEach(dir => {
    if (fs.existsSync(dir)) {
      extensiones.forEach(ext => {
        const archivos = buscarArchivosRecursivamente(dir, ext);
        archivosEncontrados = [...archivosEncontrados, ...archivos];
      });
    }
  });
  
  console.log(`\nEncontrados ${archivosEncontrados.length} archivos para examinar.`);
  
  // Examinar cada archivo en busca de la URL problemática
  let archivosModificados = 0;
  
  archivosEncontrados.forEach(archivo => {
    try {
      const contenido = fs.readFileSync(archivo, 'utf8');
      
      if (contenido.includes(urlProblematica) || 
          contenido.includes(urlProblematica.replace(/"/g, "'")) ||
          contenido.includes(urlProblematica.replace(/https:\/\/fantastic-space-rotary-phone-gg649p44xjr29wwg-3100\.app\.github\.dev\//, ''))) {
        
        console.log(`\nEncontrada referencia a la URL problemática en: ${archivo}`);
        
        // Reemplazar la URL con una ruta relativa
        let contenidoModificado = contenido;
        
        // Reemplazar la URL completa
        contenidoModificado = contenidoModificado.replace(
          new RegExp(urlProblematica.replace(/\//g, '\\/').replace(/\./g, '\\.'), 'g'),
          './ClientesMantenimiento.jsx'
        );
        
        // Reemplazar solo el nombre del archivo (en caso de que ya esté como ruta relativa)
        contenidoModificado = contenidoModificado.replace(
          /['"]ClientesMantenimiento\.jsx['"]/g,
          '"./ClientesMantenimiento.jsx"'
        );
        
        // Asegurar que los scripts tienen el tipo correcto
        contenidoModificado = contenidoModificado.replace(
          /<script([^>]*)src=['"]([^'"]*ClientesMantenimiento\.jsx)['"]([^>]*)>/g,
          (match, before, src, after) => {
            if (!match.includes('type="module"')) {
              return `<script${before}type="module" src="${src}"${after}>`;
            }
            return match;
          }
        );
        
        // Guardar el archivo modificado
        if (contenidoModificado !== contenido) {
          // Hacer copia de seguridad
          const rutaBackup = `${archivo}.backup-mime-${Date.now()}`;
          fs.writeFileSync(rutaBackup, contenido);
          
          // Guardar versión modificada
          fs.writeFileSync(archivo, contenidoModificado);
          console.log(`✅ Archivo modificado y guardado. Backup en: ${rutaBackup}`);
          archivosModificados++;
        } else {
          console.log('⚠️ No se realizaron cambios en el archivo.');
        }
      }
    } catch (error) {
      console.error(`Error al procesar archivo ${archivo}:`, error.message);
    }
  });
  
  console.log(`\nTotal de archivos modificados: ${archivosModificados}`);
  
  if (archivosModificados === 0) {
    console.log('\nNo se encontraron referencias directas a la URL problemática.');
    console.log('El problema podría estar en:');
    console.log('1. Código generado dinámicamente');
    console.log('2. Referencias en el código compilado');
    console.log('3. Configuración de rutas en el servidor');
  }
  
  console.log('\nRecomendaciones adicionales:');
  console.log('1. Reinicie el servidor de desarrollo');
  console.log('2. Limpie la caché del navegador (Ctrl+F5 o Cmd+Shift+R)');
  console.log('3. Verifique que las importaciones en los archivos JSX usen rutas relativas');
}

// Función auxiliar para buscar archivos recursivamente
function buscarArchivosRecursivamente(directorio, extension) {
  let resultados = [];
  
  if (!fs.existsSync(directorio)) {
    return resultados;
  }
  
  const archivos = fs.readdirSync(directorio);
  for (const archivo of archivos) {
    const rutaCompleta = path.join(directorio, archivo);
    
    try {
      const stat = fs.statSync(rutaCompleta);
      
      if (stat.isDirectory()) {
        resultados = resultados.concat(buscarArchivosRecursivamente(rutaCompleta, extension));
      } else if (rutaCompleta.endsWith(extension)) {
        resultados.push(rutaCompleta);
      }
    } catch (error) {
      console.error(`Error al examinar ${rutaCompleta}:`, error.message);
    }
  }
  
  return resultados;
}

// Ejecutar la solución
solucionar();
