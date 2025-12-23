/**
 * Global Type Definitions
 */

// User Types
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  profileImageBase64?: string | null;
  profileImageContentType?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: number;
  name: 'ADMIN' | 'BASIC';
  description: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    type: string;
    user: User;
  };
  timestamp: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  details: string;
}

// Error Types
export interface AppError {
  message: string;
  code: string;
  status?: number;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
}

