import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { User } from '../../domain/models/user.model';
import { AuthPort, LoginCredentials, RegisterCredentials } from '../../domain/ports/auth.port';
import { environment } from '../../../../../environments/environment';

/**
 * Adaptador HTTP que implementa AuthPort conectándose al backend Java Spring Boot.
 * Se activa cambiando `useClass: JavaAuthAdapter` en app.config.ts.
 * Endpoints: POST /api/auth/login | POST /api/auth/register
 */
@Injectable()
export class JavaAuthAdapter implements AuthPort {
  /** URL base del microservicio de autenticación */
  private readonly baseUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  /**
   * Autentica al usuario contra el backend.
   * POST /api/auth/login → { email, password }
   * @param credentials Email y contraseña del usuario
   * @returns Observable<User> con los datos del usuario y el JWT
   */
  login(credentials: LoginCredentials): Observable<User> {
    console.log('[JavaAuthAdapter] login() → iniciando petición', { email: credentials.email });
    return this.http.post<User>(`${this.baseUrl}/login`, credentials).pipe(
      tap(user => console.log('[JavaAuthAdapter] login() ← autenticación exitosa', { id: user.id, role: user.role }))
    );
  }

  /**
   * Registra un nuevo usuario en el backend.
   * POST /api/auth/register → { email, password, name }
   * @param credentials Datos del nuevo usuario
   * @returns Observable<User> con los datos del usuario creado y el JWT
   */
  register(credentials: RegisterCredentials): Observable<User> {
    console.log('[JavaAuthAdapter] register() → iniciando petición', { email: credentials.email, name: credentials.name });
    return this.http.post<User>(`${this.baseUrl}/register`, credentials).pipe(
      tap(user => console.log('[JavaAuthAdapter] register() ← usuario creado exitosamente', { id: user.id, role: user.role }))
    );
  }

  /**
   * Cierra la sesión del usuario.
   * Pendiente: implementar llamada HTTP cuando el backend exponga el endpoint.
   */
  logout(): void {
    console.log('[JavaAuthAdapter] logout() — pendiente endpoint en backend');
  }
}
