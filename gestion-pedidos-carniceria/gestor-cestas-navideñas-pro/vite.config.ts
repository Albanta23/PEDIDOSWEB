import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:10001', // Puerto correcto del backend
        changeOrigin: true,
        secure: false,
      }
    }
  }
}));
