import { Injectable, inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';
import { CreateDebtRequest, Debt } from '../../domain/models/debt.model';

/**
 * Caso de uso: crear una nueva deuda.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class CreateDebtUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Crea una nueva deuda y retorna el observable del resultado.
   * El componente padre debe suscribirse para reaccionar al resultado.
   * @param req Datos de la nueva deuda
   */
  execute(req: CreateDebtRequest): Observable<Debt> {
    console.log('[CreateDebtUseCase] execute()', req.creditor);
    this.state.loading.set(true);
    this.state.error.set(null);
    return this.port.create(req).pipe(
      finalize(() => this.state.loading.set(false)),
    );
  }
}
