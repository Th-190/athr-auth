import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import fs from 'fs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), 'LARAVEL_API_URL');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'models-and-headers',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && (req.url.startsWith('/models/') || req.url.startsWith('/libs/') || req.url.startsWith('/storage/app/models/'))) {
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              if (req.url.startsWith('/storage/app/models/')) {
                const p = path.resolve(__dirname, '.' + req.url.split('?')[0]);
                if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                  return fs.createReadStream(p).pipe(res);
                } else {
                  res.statusCode = 404;
                  return res.end('Not found');
                }
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: env.LARAVEL_API_URL || process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/sanctum': {
          target: env.LARAVEL_API_URL || process.env.LARAVEL_API_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
