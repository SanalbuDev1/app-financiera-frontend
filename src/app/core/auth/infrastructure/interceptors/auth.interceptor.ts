import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AuthStateService } from '../../application/services/auth-state.service';

/**
 * Extrae un token JWT renovado desde headers o body de la respuesta.
 */
function extractTokenFromResponse(event: unknown): string | null {
  if (!event || typeof event !== 'object' || !('type' in event) || !('headers' in event)) {
    return null;
  }

  const responseLike = event as {
    type: number;
    headers: { get: (name: string) => string | null };
    body?: unknown;
  };

  // HttpEventType.Response === 4
  if (responseLike.type !== 4) {
    return null;
  }

  const authHeader =
    responseLike.headers.get('Authorization')
    ?? responseLike.headers.get('authorization')
    ?? responseLike.headers.get('X-Auth-Token')
    ?? responseLike.headers.get('x-auth-token');

  if (authHeader) {
    return authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader.trim();
  }

  if (
    responseLike.body
    && typeof responseLike.body === 'object'
    && 'token' in responseLike.body
    && typeof (responseLike.body as { token?: unknown }).token === 'string'
  ) {
    return ((responseLike.body as { token: string }).token).trim();
  }

  return null;
}

/**
 * Interceptor HTTP funcional que adjunta el JWT en el header Authorization.
 * Se registra en app.config.ts con withInterceptors([authInterceptor]).
 * Solo agrega el header si hay un usuario autenticado con token.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const token = authState.currentUser()?.token ?? authState.restoreFromStorageIfNeeded()?.token;

  const requestToSend = token
    ? req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    })
    : req;

  if (token) {
    console.log('[authInterceptor] JWT adjuntado a', req.method, req.url);
  }

  return next(requestToSend).pipe(
    tap((event) => {
      const refreshedToken = extractTokenFromResponse(event);
      if (refreshedToken) {
        authState.updateToken(refreshedToken);
      }
    }),
    catchError((error: unknown) => {
      const isAuthEndpoint = req.url.includes('/api/auth/login') || req.url.includes('/api/auth/register');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        console.warn('[authInterceptor] 401 detectado, cerrando sesión y redirigiendo a login');
        authState.clearCurrentUser();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
