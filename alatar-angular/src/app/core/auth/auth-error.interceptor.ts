import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthService } from './auth.service';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const apiBaseUrl = inject(API_BASE_URL);
  const router = inject(Router);

  const isApiRequest = request.url.startsWith(`${apiBaseUrl}/`) || request.url.startsWith('/api/');

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      const isUnauthorized = error.status === 401;
      const isLoginRequest = request.url.includes('/api/auth/login');

      if (isApiRequest && isUnauthorized && !isLoginRequest) {
        authService.logout();

        if (typeof window !== 'undefined') {
          void router.navigateByUrl('/admin/login');
        }
      }

      return throwError(() => error);
    })
  );
};
