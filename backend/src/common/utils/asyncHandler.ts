import { Request, Response, NextFunction } from 'express';

export type AsyncRequestHandler = (
  req: Request | any,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * Wraps an async express route handler to catch rejected promises
 * and pass the error to Express's next() error handling middleware.
 */
export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

