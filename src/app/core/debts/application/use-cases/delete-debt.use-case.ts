import { Injectable, inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';

/**
 * Caso de uso: eliminar una deuda por ID.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class DeleteDebtUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Elimina la deuda y retorna el observable del resultado.
   * @param id ID de la deuda a eliminar
   */
  execute(id: string): Observable<void> {
    console.log('[DeleteDebtUseCase] execute()', id);
    this.state.loading.set(true);
    this.state.error.set(null);
    return this.port.delete(id).pipe(
      finalize(() => this.state.loading.set(false)),
    );
  }
}
