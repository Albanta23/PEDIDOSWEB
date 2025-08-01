import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["jspdf", "socket.io-client", "socket.io-parser", "engine.io-client"],
    force: true // Forzar re-optimización para evitar errores de cache
  },
  publicDir: 'public',
  resolve: {
    alias: {
      '@public': resolve(__dirname, 'public'),
    },
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
    hmr: false, // Desactivar HMR completamente
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**'] // Ignorar directorios que pueden causar reinicios
    },
    proxy: {
      '/api': {
        target: 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev',
        ws: true,
        changeOrigin: true,
        secure: false,
        proxyTimeout: 60000 // Aumentar el timeout a 60 segundos
      }
    }
  },
});
