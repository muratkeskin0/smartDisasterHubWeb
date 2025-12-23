/**
 * Auth Interceptor - Adds JWT token to requests
 */

import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../../constants/storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  return next(req);
};

