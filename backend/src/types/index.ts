import { Request } from 'express';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

export interface DbStatus {
  isConnected: boolean;
  dbError: string | null;
  readyState: number;
  databaseName: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
}
