import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AUTH_PORT } from './core/auth/infrastructure/tokens/auth.token';
import { JavaAuthAdapter } from './core/auth/infrastructure/adapters/java-auth.adapter';
import { TRANSACTION_PORT } from './core/finances/infrastructure/tokens/transaction.token';
import { JavaTransactionAdapter } from './core/finances/infrastructure/adapters/java-transaction.adapter';
import { DEBT_PORT } from './core/debts/infrastructure/tokens/debt.token';
import { JavaDebtAdapter } from './core/debts/infrastructure/adapters/java-debt.adapter';
import { authInterceptor } from './core/auth/infrastructure/interceptors/auth.interceptor';
import { provideServiceWorker } from '@angular/service-worker';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    { provide: AUTH_PORT, useClass: JavaAuthAdapter },
    { provide: TRANSACTION_PORT, useClass: JavaTransactionAdapter },
    { provide: DEBT_PORT, useClass: JavaDebtAdapter },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
