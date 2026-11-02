import { app } from '../backend/src/app';
import { connectToDatabase } from '../backend/src/config/database';

let dbPromise: Promise<boolean> | null = null;

const ensureDb = async () => {
  if (!dbPromise) {
    dbPromise = connectToDatabase().catch((err: any) => {
      console.warn('[Vercel Serverless] MongoDB connection attempt note:', err?.message || err);
      return false;
    });
  }
  return dbPromise;
};

// Ensure database connection is initialized before handling any API request
app.use(async (_req, _res, next) => {
  await ensureDb();
  next();
});

export default app;

