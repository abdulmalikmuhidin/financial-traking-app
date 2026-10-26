import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({ error: message });
};
