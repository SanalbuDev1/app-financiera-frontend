import { InjectionToken } from '@angular/core';
import { AuthPort } from '../../domain/ports/auth.port';

/** Token DI para inyectar el adaptador de autenticación (MockAuthAdapter o JavaAuthAdapter) */
export const AUTH_PORT = new InjectionToken<AuthPort>('AUTH_PORT');
