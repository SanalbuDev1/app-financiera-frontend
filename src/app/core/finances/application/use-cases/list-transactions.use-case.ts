import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { TransactionStateService } from '../services/transaction-state.service';
import { TransactionFilter } from '../../domain/ports/transaction.port';

/**
 * Caso de uso: listar transacciones con filtro y paginación.
 * @Injectable() sin providedIn — se provee en dashboard.routes.ts.
 */
@Injectable()
export class ListTransactionsUseCase {
  private readonly port = inject(TRANSACTION_PORT);
  private readonly state = inject(TransactionStateService);

  /**
   * Ejecuta la consulta de transacciones y actualiza el estado global.
   * @param filter Parámetros de filtro y paginación
   */
  execute(filter: TransactionFilter): void {
    console.log('[ListTransactionsUseCase] execute()', filter);
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.getAll(filter).pipe(
      tap(response => this.state.setPaginatedTransactions(response)),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListTransactionsUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar transacciones');
      },
    });
  }

  /**
   * Carga todas las transacciones sin paginación (para gráficos y análisis).
   */
  loadAll(): void {
    console.log('[ListTransactionsUseCase] loadAll()');
    this.port.getAllNoPagination().pipe(
      tap(list => this.state.setAllTransactions(list)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListTransactionsUseCase] loadAll() ← error', err);
      },
    });
  }
}
