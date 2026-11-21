import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { UPLOAD_DIR } from './controllers/uploadController.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: '100kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false, setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff') }));
  app.use('/api', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
