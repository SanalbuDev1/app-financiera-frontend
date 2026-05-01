import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../../application/services/auth-state.service';

/**
 * Guard de autenticación: protege rutas que requieren sesión activa.
 * En SSR (servidor) deja pasar siempre — el cliente evalúa tras leer localStorage.
 * En el browser redirige a /login si el usuario no está autenticado.
 */
export const authGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  if (!isBrowser) {
    console.log('[authGuard] SSR — dejando pasar, el cliente evaluará');
    return true;
  }

  if (authState.isAuthenticated()) {
    console.log('[authGuard] acceso permitido');
    return true;
  }

  console.warn('[authGuard] acceso denegado — redirigiendo a /login');
  return router.createUrlTree(['/login']);
};
