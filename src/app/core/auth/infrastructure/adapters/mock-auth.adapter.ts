import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../../domain/models/user.model';
import { UserRole } from '../../domain/models/user-role.model';
import { AuthPort, LoginCredentials, RegisterCredentials } from '../../domain/ports/auth.port';

interface MockUserRecord extends User {
  password: string;
}

/** Usuarios de prueba disponibles en el mock */
const MOCK_USERS: MockUserRecord[] = [
  {
    id: '1',
    email: 'admin@financiera.com',
    password: 'admin123',
    name: 'Admin User',
    role: UserRole.ADMIN,
    token: 'mock-jwt-admin-token',
  },
  {
    id: '2',
    email: 'user@financiera.com',
    password: 'user123',
    name: 'Regular User',
    role: UserRole.USER,
    token: 'mock-jwt-user-token',
  },
];

/**
 * Adaptador mock de autenticación para desarrollo local.
 * Simula el backend con usuarios en memoria y un delay de 600ms.
 * Para activar el backend real, cambiar a JavaAuthAdapter en app.config.ts.
 */
@Injectable()
export class MockAuthAdapter implements AuthPort {
  /**
   * Simula el login verificando credenciales contra MOCK_USERS.
   * @returns Observable<User> con delay de 600ms, o error si las credenciales son inválidas
   */
  login(credentials: LoginCredentials): Observable<User> {
    console.log('[MockAuthAdapter] login() → verificando credenciales', { email: credentials.email });
    const found = MOCK_USERS.find(
      (u) =>
        u.email === credentials.email && u.password === credentials.password
    );

    if (!found) {
      console.warn('[MockAuthAdapter] login() ← credenciales inválidas', { email: credentials.email });
      return throwError(() => new Error('Credenciales inválidas'));
    }

    const { password: _password, ...user } = found;
    console.log('[MockAuthAdapter] login() ← autenticación exitosa', { id: user.id, role: user.role });
    return of(user).pipe(delay(600));
  }

  /**
   * Pendiente: limpiar estado cuando Java backend esté conectado.
   */
  logout(): void {
    console.log('[MockAuthAdapter] logout() — sin implementación en mock');
  }

  /**
   * Simula el registro de un nuevo usuario en MOCK_USERS.
   * @returns Observable<User> con delay de 600ms, o error si el email ya existe
   */
  register(credentials: RegisterCredentials): Observable<User> {
    console.log('[MockAuthAdapter] register() → registrando usuario', { email: credentials.email, name: credentials.name });
    const exists = MOCK_USERS.some((u) => u.email === credentials.email);

    if (exists) {
      console.warn('[MockAuthAdapter] register() ← email ya registrado', { email: credentials.email });
      return throwError(() => new Error('El correo ya está registrado'));
    }

    const newUser: MockUserRecord = {
      id: String(MOCK_USERS.length + 1),
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      role: UserRole.USER,
      token: `mock-jwt-user-token-${Date.now()}`,
    };

    MOCK_USERS.push(newUser);

    const { password: _password, ...user } = newUser;
    console.log('[MockAuthAdapter] register() ← usuario creado exitosamente', { id: user.id, role: user.role });
    return of(user).pipe(delay(600));
  }
}
