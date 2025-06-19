import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

export default defineConfig({
  root: 'src/clientes-gestion',
  plugins: [react()],
  build: {
    outDir: '../../dist-clientes-gestion',
    emptyOutDir: true
  },
  server: {
    port: 3100,
    proxy: {
      '/api': 'http://localhost:10001' // Ajusta si tu backend está en otro puerto
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/clientes-gestion')
    }
  }
});
