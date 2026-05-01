import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../../application/services/auth-state.service';

/**
 * Interceptor HTTP funcional que adjunta el JWT en el header Authorization.
 * Se registra en app.config.ts con withInterceptors([authInterceptor]).
 * Solo agrega el header si hay un usuario autenticado con token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const token = authState.currentUser()?.token;

  if (token) {
    const cloned = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
    console.log('[authInterceptor] JWT adjuntado a', req.method, req.url);
    return next(cloned);
  }

  return next(req);
};
