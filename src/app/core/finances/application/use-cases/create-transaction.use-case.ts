import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { TransactionStateService } from '../services/transaction-state.service';
import { CreateTransactionDto } from '../../domain/ports/transaction.port';

/**
 * Caso de uso: crear una nueva transacción (ingreso o gasto).
 * @Injectable() sin providedIn — se provee en dashboard.routes.ts.
 */
@Injectable()
export class CreateTransactionUseCase {
  private readonly port = inject(TRANSACTION_PORT);
  private readonly state = inject(TransactionStateService);

  /**
   * Crea la transacción vía el adaptador y actualiza el estado.
   * @param dto Datos de la transacción a crear
   * @param onSuccess Callback opcional tras creación exitosa
   */
  execute(dto: CreateTransactionDto, onSuccess?: () => void): void {
    console.log('[CreateTransactionUseCase] execute()', dto);
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.create(dto).pipe(
      tap(tx => {
        this.state.addTransaction(tx);
        console.log('[CreateTransactionUseCase] execute() ← creada', tx.id);
        onSuccess?.();
      }),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[CreateTransactionUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al crear transacción');
      },
    });
  }
}
