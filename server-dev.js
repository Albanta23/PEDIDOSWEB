// Servidor Express para solucionar problemas de MIME en archivos JSX
// Para usar en caso de que esté utilizando Node.js/Express como servidor en desarrollo

const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3100;

// Habilitar CORS para todas las rutas
app.use(cors());

// Configurar cabeceras para tipos MIME correctos
app.use((req, res, next) => {
  // Configurar tipo MIME para archivos JSX
  if (req.path.endsWith('.jsx')) {
    res.type('application/javascript');
  }
  next();
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Servir archivos estáticos desde la carpeta 'src'
// Esto es para desarrollo, no recomendado para producción
app.use('/src', express.static(path.join(__dirname, 'src')));

// Registrar todas las solicitudes para depuración
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Ruta específica para archivos JSX
app.get('/**/*.jsx', (req, res, next) => {
  console.log(`Solicitud de archivo JSX: ${req.path}`);
  res.type('application/javascript');
  next();
});

// Manejar rutas de SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
  console.log(`Configurado para servir archivos JSX con tipo MIME correcto`);
});
