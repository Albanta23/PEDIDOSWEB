// Proxy para desarrollo local con Vite
module.exports = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
    secure: false,
  },
};
