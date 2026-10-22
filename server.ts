import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectToDatabase } from './backend/db';
import authRoutes from './backend/routes/auth';
import transactionRoutes from './backend/routes/transactions';
import budgetRoutes from './backend/routes/budgets';
import categoryRoutes from './backend/routes/categories';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Global Middleware
  app.use(cors());
  app.use(express.json());

  // Attempt MongoDB connection asynchronously
  connectToDatabase().catch((err) => {
    console.warn('[Server] MongoDB connection attempt finished with message:', err.message || err);
  });

  // Mount API Endpoints
  app.use('/api/auth', authRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/budgets', budgetRoutes);
  app.use('/api/categories', categoryRoutes);

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FinTrack] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
