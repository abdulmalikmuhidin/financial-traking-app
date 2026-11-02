import mongoose from 'mongoose';
import { env } from './env';
import { CategoryModel } from '../models/Category';
import { SYSTEM_DEFAULT_CATEGORIES } from './defaultCategories';

let isConnected = false;
let dbError: string | null = null;

async function seedDefaultCategoriesIfEmpty() {
  try {
    const count = await CategoryModel.countDocuments({ isDefault: true });
    if (count === 0) {
      await CategoryModel.insertMany(SYSTEM_DEFAULT_CATEGORIES);
      console.log('[MongoDB] Initialized default financial categories.');
    }
  } catch (err: any) {
    console.warn('[MongoDB] Default category check note:', err.message || err);
  }
}

export const connectToDatabase = async (): Promise<boolean> => {
  const uri = env.MONGODB_URI;

  if (!uri || uri.includes('<password>')) {
    dbError = 'MONGODB_URI is not configured or contains placeholder <password>.';
    console.error('\x1b[31m%s\x1b[0m', `[MongoDB Error] ${dbError}`);
    return false;
  }

  try {
    const sanitizedUri = uri.replace(/\.mongodb\.net\/\/+/, '.mongodb.net/');

    mongoose.set('strictQuery', false);
    await mongoose.connect(sanitizedUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    dbError = null;
    console.log('\x1b[32m%s\x1b[0m', '[MongoDB] Connected successfully to live database.');

    await seedDefaultCategoriesIfEmpty();
    return true;
  } catch (error: any) {
    isConnected = false;
    dbError = error.message || 'Failed to connect to MongoDB instance';
    console.error('\x1b[31m%s\x1b[0m', `[MongoDB Error] Could not connect: ${dbError}`);
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

export const assertDbConnected = () => {
  const status = getDbStatus();
  if (!status.isConnected) {
    throw {
      statusCode: 503,
      message: 'Database service is currently unavailable. Please verify MongoDB connection.',
    };
  }
};
