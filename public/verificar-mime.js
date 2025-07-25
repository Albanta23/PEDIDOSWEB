// Script para verificar y solucionar problemas MIME
// Este archivo debe ser servido con Content-Type: application/javascript
console.log('✅ verificar-mime.js cargado correctamente');

// Verificar que el navegador recibe los tipos MIME correctos
function verificarMIME() {
  const scripts = document.querySelectorAll('script');
  let problemasMIME = false;
  
  scripts.forEach(script => {
    if (script.src && script.src.includes('.js') && script.getAttribute('type') !== 'module') {
      fetch(script.src, { method: 'HEAD' })
        .then(response => {
          const contentType = response.headers.get('Content-Type');
          if (!contentType || !contentType.includes('javascript')) {
            console.warn('⚠️ Problema MIME detectado:', script.src, 'Content-Type:', contentType);
            problemasMIME = true;
          }
        })
        .catch(error => {
          console.error('Error verificando MIME:', error);
        });
    }
  });
  
  if (!problemasMIME) {
    console.log('✅ No se detectaron problemas MIME en los scripts cargados');
  }
}

// Ejecutar la verificación después de que se cargue la página
if (document.readyState === 'complete') {
  verificarMIME();
} else {
  window.addEventListener('load', verificarMIME);
}

// Exportar para que sea reconocido como un módulo válido
export default { verificarMIME };
