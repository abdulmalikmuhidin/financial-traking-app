import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './app';
import { env } from './config/env';
import { connectToDatabase } from './config/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Root of project is two levels up from backend/src
const projectRoot = path.resolve(__dirname, '../../');

async function startServer() {
  const PORT = env.PORT;

  // Attempt MongoDB connection asynchronously
  connectToDatabase().catch((err) => {
    console.warn('[Server] MongoDB connection attempt finished with message:', err.message || err);
  });

  if (!env.isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: projectRoot,
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(projectRoot, 'dist');
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
