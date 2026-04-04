import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '../config/api-base-url.token';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const apiBaseUrl = inject(API_BASE_URL);
  const token = authService.getAccessToken();

  if (!token) {
    return next(request);
  }

  const isApiRequest = request.url.startsWith(`${apiBaseUrl}/`) || request.url.startsWith('/api/');

  if (!isApiRequest) {
    return next(request);
  }

  const authorizedRequest = request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authorizedRequest);
};
