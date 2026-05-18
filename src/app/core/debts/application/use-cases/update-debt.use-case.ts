import { Injectable, inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';
import { UpdateDebtRequest, Debt } from '../../domain/models/debt.model';

/**
 * Caso de uso: actualizar los datos editables de una deuda.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class UpdateDebtUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Actualiza la deuda y retorna el observable del resultado.
   * @param id ID de la deuda
   * @param req Datos editables (creditor, description, notes)
   */
  execute(id: string, req: UpdateDebtRequest): Observable<Debt> {
    console.log('[UpdateDebtUseCase] execute()', id);
    this.state.loading.set(true);
    this.state.error.set(null);
    return this.port.update(id, req).pipe(
      finalize(() => this.state.loading.set(false)),
    );
  }
}
