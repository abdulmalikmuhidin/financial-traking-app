import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let isConnected = false;
let dbError: string | null = null;

export const connectToDatabase = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<password>')) {
    dbError = 'MONGODB_URI contains placeholder <password> or is not configured.';
    console.warn('\x1b[33m%s\x1b[0m', `[MongoDB Notice] ${dbError}`);
    console.warn('\x1b[33m%s\x1b[0m', '[MongoDB Notice] Using resilient local store. To connect to MongoDB, edit .env with your real MongoDB Atlas credentials.');
    return false;
  }

  try {
    // Sanitize any accidental double slashes in the path part (e.g. .mongodb.net//database -> .mongodb.net/database)
    const sanitizedUri = uri.replace(/\.mongodb\.net\/\/+/, '.mongodb.net/');

    mongoose.set('strictQuery', false);
    await mongoose.connect(sanitizedUri, {
      serverSelectionTimeoutMS: 4000,
    });

    isConnected = true;
    dbError = null;
    console.log('\x1b[32m%s\x1b[0m', '[MongoDB] Connected successfully to live database.');
    return true;
  } catch (error: any) {
    isConnected = false;
    dbError = error.message || 'Failed to connect to MongoDB instance';
    console.warn('\x1b[31m%s\x1b[0m', `[MongoDB Warning] Could not connect: ${dbError}`);
    console.warn('\x1b[33m%s\x1b[0m', '[MongoDB] Falling back to persistent fallback store to keep app fully operational.');
    return false;
  }
};

export const getDbStatus = () => {
  return {
    isConnected: isConnected && mongoose.connection.readyState === 1,
    dbError,
    readyState: mongoose.connection.readyState,
    databaseName: mongoose.connection.name || 'fintrack',
  };
};
