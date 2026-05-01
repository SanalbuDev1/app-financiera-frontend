import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { TransactionStateService } from '../services/transaction-state.service';
import { UpdateTransactionDto } from '../../domain/ports/transaction.port';

/**
 * Caso de uso: actualizar una transacción existente.
 * @Injectable() sin providedIn — se provee en dashboard.routes.ts.
 */
@Injectable()
export class UpdateTransactionUseCase {
  private readonly port = inject(TRANSACTION_PORT);
  private readonly state = inject(TransactionStateService);

  /**
   * Actualiza la transacción vía el adaptador y actualiza el estado.
   * @param id ID de la transacción a actualizar
   * @param dto Datos actualizados de la transacción
   * @param onSuccess Callback opcional tras actualización exitosa
   */
  execute(id: string, dto: UpdateTransactionDto, onSuccess?: () => void): void {
    console.log('[UpdateTransactionUseCase] execute()', { id, dto });
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.update(id, dto).pipe(
      tap(tx => {
        this.state.updateTransaction(tx);
        console.log('[UpdateTransactionUseCase] execute() ← actualizada', tx.id);
        onSuccess?.();
      }),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[UpdateTransactionUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al actualizar transacción');
      },
    });
  }
}
