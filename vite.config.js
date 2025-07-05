import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["jspdf", "socket.io-client"]
  },
  build: {
    rollupOptions: {
      external: [],
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      overlay: false, // Deshabilitar overlay de errores que puede causar reinicios
      ...(process.env.CODESPACE_NAME ? {
        protocol: 'wss',
        host: `${process.env.CODESPACE_NAME}-3000.app.github.dev`,
        clientPort: 443,
        port: 443
      } : {
        port: 24678 // Puerto específico para HMR en local
      })
    },
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**'] // Ignorar directorios que pueden causar reinicios
    },
    // proxy: {
    //   '/api': 'https://pedidos-backend-0e1s.onrender.com'
    // }
  },
});
