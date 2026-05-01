import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { LoginCredentials } from '../../domain/ports/auth.port';
import { AUTH_PORT } from '../../infrastructure/tokens/auth.token';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Caso de uso: Login de usuario.
 * Delega la autenticación al adaptador (mock o real) y actualiza el estado global.
 * Provisto en login.routes.ts — no usar providedIn: 'root'.
 */
@Injectable()
export class LoginUseCase {
  private readonly authPort = inject(AUTH_PORT);
  private readonly authState = inject(AuthStateService);

  /**
   * Ejecuta el flujo de login.
   * @param credentials Email y contraseña del usuario
   * @returns Observable<User> — el componente suscribe y navega según el rol
   */
  execute(credentials: LoginCredentials): Observable<User> {
    console.log('[LoginUseCase] execute() → iniciando login', { email: credentials.email });
    return this.authPort.login(credentials).pipe(
      tap((user) => {
        console.log('[LoginUseCase] execute() ← login exitoso, actualizando estado', { role: user.role });
        this.authState.setCurrentUser(user);
      })
    );
  }
}
