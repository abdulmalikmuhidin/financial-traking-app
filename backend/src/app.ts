import express, { Application } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { securityHeadersMiddleware } from './common/middleware/security.middleware';

export function createApp(): Application {
  const app = express();

  // Security headers & CORS
  app.use(securityHeadersMiddleware);
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body Parsing Middleware
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Mount API Endpoints
  app.use('/api', apiRouter);

  // 404 Catch-All & Centralized Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
