import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/owner/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'serve-root-manifest',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/manifest.webmanifest') {
            req.url = '/owner/manifest.webmanifest';
            return next();
          }

          // If a request hits root dev server directly without /owner prefix (and not internal assets/api)
          const rawUrl = req.url || '';
          if (
            !rawUrl.startsWith('/owner') &&
            !rawUrl.startsWith('/api') &&
            !rawUrl.startsWith('/uploads') &&
            !rawUrl.startsWith('/@') &&
            !rawUrl.startsWith('/src') &&
            !rawUrl.startsWith('/node_modules') &&
            !rawUrl.includes('.')
          ) {
            res.writeHead(302, { Location: `/owner${rawUrl === '/' ? '' : rawUrl}` });
            res.end();
            return;
          }

          next();
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
