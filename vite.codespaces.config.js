import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Configuración específica para Socket.io en GitHub Codespaces
  optimizeDeps: {
    include: [
      "socket.io-client",
      "socket.io-client/debug",
      "socket.io-parser",
      "engine.io-client",
      "jspdf"
    ],
    exclude: [],
    force: true, // Forzar re-optimización siempre
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'dynamic-import': true
      }
    }
  },
  
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@public': resolve(__dirname, 'public'),
    },
  },
  
  build: {
    target: 'es2020',
    rollupOptions: {
      external: [],
    },
    commonjsOptions: {
      include: [/socket\.io/, /node_modules/]
    }
  },
  
  test: {
    globals: true,
    environment: 'jsdom',
  },
  
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false, // Permitir puerto alternativo si 3000 está ocupado
    
    // Configuración HMR específica para Codespaces
    hmr: {
      port: 3001,
      host: 'localhost',
      overlay: false, // Deshabilitar overlay de errores que puede causar problemas
      clientPort: 3001, // Puerto específico para el cliente
      protocol: 'ws' // Usar WebSocket normal, no WSS
    },
    
    // Configuración de archivos optimizada para Codespaces
    fs: {
      strict: false,
      allow: ['..', '.']
    },
    
    watch: {
      usePolling: true, // Usar polling en contenedores
      interval: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/.vite/**'
      ]
    },
    
    // Proxy optimizado con timeouts más largos
    proxy: {
      '/api': {
        target: 'http://localhost:10001',
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        proxyTimeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      },
      '/socket.io': {
        target: 'http://localhost:10001',
        ws: true,
        changeOrigin: true,
        secure: false,
        timeout: 30000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Socket.io proxy error:', err);
          });
        }
      }
    },
    
    // Configuración CORS específica
    cors: {
      origin: true,
      credentials: true
    }
  },
  
  // Prevenir errores comunes en Codespaces
  esbuild: {
    target: 'es2020',
    logOverride: {
      'this-is-undefined-in-esm': 'silent'
    }
  }
});
