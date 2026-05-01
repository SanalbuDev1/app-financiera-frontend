import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { TransactionStateService } from '../services/transaction-state.service';

/**
 * Caso de uso: eliminar una transacción por ID.
 * @Injectable() sin providedIn — se provee en dashboard.routes.ts.
 */
@Injectable()
export class DeleteTransactionUseCase {
  private readonly port = inject(TRANSACTION_PORT);
  private readonly state = inject(TransactionStateService);

  /**
   * Elimina la transacción vía el adaptador y la remueve del estado.
   * @param id ID de la transacción a eliminar
   * @param onSuccess Callback opcional tras eliminación exitosa
   */
  execute(id: string, onSuccess?: () => void): void {
    console.log('[DeleteTransactionUseCase] execute()', id);
    this.state.loading.set(true);
    this.state.error.set(null);

    // Optimistic: remueve del estado inmediatamente
    this.state.removeTransaction(id);

    this.port.delete(id).pipe(
      tap(() => {
        console.log('[DeleteTransactionUseCase] execute() ← eliminada', id);
        onSuccess?.();
      }),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[DeleteTransactionUseCase] execute() ← error, restaurando', err);
        this.state.error.set(err?.message ?? 'Error al eliminar transacción');
        // TODO: restaurar la transacción si falla (rollback optimistic)
      },
    });
  }
}
