import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { RegisterCredentials } from '../../domain/ports/auth.port';
import { AUTH_PORT } from '../../infrastructure/tokens/auth.token';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Caso de uso: Registro de nuevo usuario.
 * Delega el registro al adaptador y actualiza el estado global con el nuevo usuario.
 * Provisto en register.routes.ts — no usar providedIn: 'root'.
 */
@Injectable()
export class RegisterUseCase {
  private readonly authPort = inject(AUTH_PORT);
  private readonly authState = inject(AuthStateService);

  /**
   * Ejecuta el flujo de registro.
   * @param credentials Datos del nuevo usuario (email, password, name)
   * @returns Observable<User> — el componente suscribe y navega al dashboard
   */
  execute(credentials: RegisterCredentials): Observable<User> {
    console.log('[RegisterUseCase] execute() → iniciando registro', { email: credentials.email });
    return this.authPort.register(credentials).pipe(
      tap((user) => {
        console.log('[RegisterUseCase] execute() ← registro exitoso, actualizando estado', { id: user.id, role: user.role });
        this.authState.setCurrentUser(user);
      })
    );
  }
}
