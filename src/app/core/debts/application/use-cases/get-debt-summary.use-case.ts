import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';

/**
 * Caso de uso: obtener el resumen global de deudas del usuario.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class GetDebtSummaryUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Carga el resumen de deudas y actualiza el estado global.
   */
  execute(): void {
    console.log('[GetDebtSummaryUseCase] execute()');
    this.port.getSummary().pipe(
      tap(summary => this.state.setSummary(summary)),
    ).subscribe({
      error: (err) => {
        console.warn('[GetDebtSummaryUseCase] execute() ← error', err);
      },
    });
  }
}
