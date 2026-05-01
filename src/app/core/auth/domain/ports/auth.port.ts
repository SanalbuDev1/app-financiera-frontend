import { Observable } from 'rxjs';
import { User } from '../models/user.model';

/** Credenciales para el login */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Credenciales para el registro de un nuevo usuario */
export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

/**
 * Puerto de autenticación (interfaz del dominio).
 * Define el contrato que deben implementar todos los adaptadores de auth.
 * Sin dependencias de Angular — solo TypeScript puro.
 */
export interface AuthPort {
  /** Autentica al usuario y retorna sus datos + JWT */
  login(credentials: LoginCredentials): Observable<User>;
  /** Registra un nuevo usuario y retorna sus datos + JWT */
  register(credentials: RegisterCredentials): Observable<User>;
  /** Cierra la sesión activa */
  logout(): void;
}
