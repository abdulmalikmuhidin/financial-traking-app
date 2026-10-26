import dotenv from 'dotenv';

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Insecure default detection & validation
const DEFAULT_DEV_JWT_SECRET = 'fintrack_jwt_default_secret_key_2026';
let jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === DEFAULT_DEV_JWT_SECRET) {
  if (isProduction) {
    console.error('\x1b[31m%s\x1b[0m', '[SECURITY CRITICAL] JWT_SECRET is not set or is using the insecure default key in production! Set a cryptographically secure JWT_SECRET in your environment.');
    // In production, enforce secret configuration
    throw new Error('Insecure JWT_SECRET detected in production environment.');
  } else {
    console.warn('\x1b[33m%s\x1b[0m', '[SECURITY WARNING] Using development default JWT_SECRET. Set JWT_SECRET in .env for production.');
    jwtSecret = DEFAULT_DEV_JWT_SECRET;
  }
}

export const env = {
  NODE_ENV,
  isProduction,
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: jwtSecret,
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || '"FinTrack Security" <noreply@fintrack.app>',
};
