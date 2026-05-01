import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../domain/models/user-role.model';
import { AuthStateService } from '../../application/services/auth-state.service';

/**
 * Guard de roles: protege rutas que requieren un rol específico.
 * Redirige a /dashboard si el usuario no tiene el rol requerido.
 * @param requiredRole Rol mínimo necesario para acceder a la ruta
 */
export const roleGuard = (requiredRole: UserRole): CanActivateFn =>
  () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    if (authState.userRole() === requiredRole) {
      console.log('[roleGuard] acceso permitido para rol', requiredRole);
      return true;
    }

    console.warn('[roleGuard] acceso denegado — rol requerido:', requiredRole, '— rol actual:', authState.userRole());
    return router.createUrlTree(['/dashboard']);
  };
