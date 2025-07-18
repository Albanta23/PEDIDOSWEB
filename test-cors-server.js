// Script para probar conexión CORS
const express = require('express');
const app = express();
const port = 10001;

// Middleware para servir archivos estáticos
app.use(express.static('.'));

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor de prueba corriendo en el puerto ${port}`);
  console.log(`Puedes acceder a él desde: https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev/`);
  console.log('Abre index.html o debug-frontend-connectivity.js para probar la conexión CORS');
});
