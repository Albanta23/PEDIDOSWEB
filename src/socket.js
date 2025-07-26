import { io } from 'socket.io-client';

// La URL del backend. En un entorno de producción, es mejor obtenerla
// de una variable de entorno (ej: import.meta.env.VITE_SOCKET_URL).
const SOCKET_URL = 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev';

console.log(`[Socket.IO Client] Creando instancia para ${SOCKET_URL}`);

// Se crea una única instancia del socket que persistirá a través de los re-renders
// y se conectará automáticamente al ser importada.
export const socket = io(SOCKET_URL);