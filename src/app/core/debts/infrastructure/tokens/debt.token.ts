import { InjectionToken } from '@angular/core';
import { DebtPort } from '../../domain/ports/debt.port';

/** Token de inyección para el adaptador de deudas */
export const DEBT_PORT = new InjectionToken<DebtPort>('DEBT_PORT');
