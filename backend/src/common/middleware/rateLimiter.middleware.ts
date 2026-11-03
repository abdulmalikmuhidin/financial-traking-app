import { Request, Response, NextFunction } from 'express';
import { TooManyRequestsError } from '../errors/AppError';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * Creates an in-memory rate limiter middleware.
 * @param windowMs Time window in milliseconds
 * @param max Max allowed requests within windowMs
 * @param message Custom message on rate limit exceeded
 */
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute default
  const max = options.max || 10;
  const message = options.message || 'Too many requests. Please slow down and try again later.';
  const keyGenerator =
    options.keyGenerator ||
    ((req: Request) => {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      return `${Array.isArray(ip) ? ip[0] : ip.split(',')[0].trim()}:${req.baseUrl}${req.path}`;
    });

  const store = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not prevent node process from exiting
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let record = store.get(key);

    if (!record || record.resetAt <= now) {
      record = { count: 1, resetAt: now + windowMs };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

    if (record.count > max) {
      return next(new TooManyRequestsError(message));
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again after 1 minute.',
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many verification code requests. Please wait a minute before requesting again.',
});

