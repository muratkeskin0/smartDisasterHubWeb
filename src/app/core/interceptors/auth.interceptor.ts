/**
 * Auth Interceptor - Adds JWT token to requests
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../../constants/storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (token && !isTokenExpired(token)) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  if (token && isTokenExpired(token)) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }

  return next(req);
};

function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return false;
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
    const decodedPayload = atob(paddedPayload);
    const parsedPayload = JSON.parse(decodedPayload) as { exp?: number };

    if (!parsedPayload.exp) {
      return false;
    }

    return parsedPayload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

