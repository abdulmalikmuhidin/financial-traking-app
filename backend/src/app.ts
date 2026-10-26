import express, { Application } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

export function createApp(): Application {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mount API Endpoints
  app.use('/api', apiRouter);

  return app;
}

export const app = createApp();
