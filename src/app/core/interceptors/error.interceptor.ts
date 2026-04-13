/**
 * Error Interceptor - Handles HTTP errors
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized
      if (error.status === 401) {
        authService.logout(false);
        router.navigate(['/login']);
      }

      // Handle network errors
      if (!error.status) {
        console.error('Network error:', error);
      }

      return throwError(() => error);
    })
  );
};

