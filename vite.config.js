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
    hmr: {
      protocol: 'wss',
      host: `${process.env.CODESPACE_NAME}-3000.app.github.dev`,
      clientPort: 443
    },
    // proxy: {
    //   '/api': 'https://pedidos-backend-0e1s.onrender.com'
    // }
  },
});
