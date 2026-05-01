import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/models/user-role.model';

/**
 * Servicio global de estado de autenticación.
 * Expone signals de solo lectura para que los componentes reaccionen al estado de sesión.
 * Singleton: providedIn 'root'.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  /** Signal privado que almacena el usuario autenticado o null si no hay sesión */
  private readonly _currentUser = signal<User | null>(null);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Usuario autenticado actual (solo lectura) */
  readonly currentUser = this._currentUser.asReadonly();

  /** true si hay un usuario autenticado activo */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Rol del usuario actual, o null si no hay sesión */
  readonly userRole = computed<UserRole | null>(() => this._currentUser()?.role ?? null);

  constructor() {
    if (!this.isBrowser) return;
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        this._currentUser.set(user);
        console.log('[AuthStateService] constructor() — sesión restaurada desde localStorage', {
          id: user.id,
          role: user.role,
        });
      } catch {
        console.warn(
          '[AuthStateService] constructor() — datos corruptos en localStorage, limpiando',
        );
        localStorage.removeItem('currentUser');
      }
    }
  }
  /**
   * Establece el usuario autenticado en el estado global.
   * @param user Datos del usuario devueltos por el backend/adapter
   */
  setCurrentUser(user: User): void {
    console.log('[AuthStateService] setCurrentUser()', { id: user.id, role: user.role });
    if (this.isBrowser) localStorage.setItem('currentUser', JSON.stringify(user));
    this._currentUser.set(user);
  }

  /**
   * Limpia el estado de autenticación (logout).
   */
  clearCurrentUser(): void {
    console.log('[AuthStateService] clearCurrentUser() — sesión limpiada');
    if (this.isBrowser) localStorage.removeItem('currentUser');
    this._currentUser.set(null);
  }
}
