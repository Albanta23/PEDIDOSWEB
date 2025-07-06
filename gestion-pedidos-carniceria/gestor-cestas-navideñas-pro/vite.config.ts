import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => ({
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    }
  }
}));
