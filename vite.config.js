import { defineConfig } from 'vite';
import { search } from './mock/records.js';

// Stand-ins for the two blindem endpoints that take input: the palette search (GET /buscar) and
// "mark all notifications read" (POST /notificaciones/leer). Everything else is static JSON in public/data.
const mockApi = () => {
  const handler = (req, res, next) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/buscar') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ data: search(url.searchParams.get('q') || '') }));
      return;
    }
    if (url.pathname === '/notificaciones/leer') {
      res.statusCode = 204;
      res.end();
      return;
    }
    next();
  };
  return {
    name: 'dapta-mock-api',
    configureServer(server) { server.middlewares.use(handler); },
    configurePreviewServer(server) { server.middlewares.use(handler); },
  };
};

export default defineConfig({
  plugins: [mockApi()],
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
});
