/**
 * Error Interceptor - Handles HTTP errors
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { isAuthRequestUrl } from '../utils/api-error.util';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && authService.isAuthenticated && !isAuthRequestUrl(req.url)) {
        authService.logout(false);
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
