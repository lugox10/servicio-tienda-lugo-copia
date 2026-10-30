import jsonServer from 'json-server';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, '2-servicio', 'db.json'));
const middlewares = jsonServer.defaults();

server.use(middlewares);

server.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'servicio-tienda' });
});

server.use(router);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Healthcheck en http://localhost:${PORT}/api/health`);
});