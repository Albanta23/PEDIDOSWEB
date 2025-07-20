import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["jspdf", "socket.io-client"],
    exclude: [], // No excluir socket.io-client
    force: true // Forzar re-optimización
  },
  define: {
    global: 'globalThis',
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
    hmr: {
      port: 3001, // Puerto específico para HMR
      host: 'localhost',
      clientPort: 3001,
      protocol: 'ws' // Usar WebSocket normal, no WSS
    },
    watch: {
      usePolling: false,
      interval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**'] // Ignorar directorios que pueden causar reinicios
    },
    // Configuración específica para GitHub Codespaces
    fs: {
      strict: false,
      allow: ['..']
    },
    proxy: {
      '/api': {
        target: 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev',
        changeOrigin: true,
        secure: false,
        timeout: 60000
      },
      '/socket.io': {
        target: 'https://fantastic-space-rotary-phone-gg649p44xjr29wwg-10001.app.github.dev',
        ws: true,
        changeOrigin: true,
        secure: false,
        timeout: 60000
      }
    }
  },
});
