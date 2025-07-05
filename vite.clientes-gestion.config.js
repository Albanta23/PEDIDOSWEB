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
    port: 3100
    // Proxy deshabilitado para Codespaces - usamos URLs completas desde variables de entorno
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/clientes-gestion')
    }
  }
});
