import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { TransactionStateService } from '../services/transaction-state.service';

/**
 * Caso de uso: obtener el resumen financiero del mes.
 * @Injectable() sin providedIn — se provee en dashboard.routes.ts.
 */
@Injectable()
export class GetSummaryUseCase {
  private readonly port = inject(TRANSACTION_PORT);
  private readonly state = inject(TransactionStateService);

  /**
   * Consulta el resumen del mes/año indicado y actualiza el estado.
   * @param month Mes (1-12)
   * @param year Año (e.g. 2026)
   */
  execute(month: number, year: number): void {
    console.log('[GetSummaryUseCase] execute()', { month, year });
    this.state.loading.set(true);

    this.port.getSummary(month, year).pipe(
      tap(summary => this.state.setSummary(summary)),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[GetSummaryUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar resumen');
      },
    });
  }
}
