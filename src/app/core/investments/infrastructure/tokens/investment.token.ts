import { InjectionToken } from '@angular/core';
import { InvestmentPort } from '../../domain/ports/investment.port';

/** Token DI para inyectar el adaptador de inversiones */
export const INVESTMENT_PORT = new InjectionToken<InvestmentPort>('INVESTMENT_PORT');
