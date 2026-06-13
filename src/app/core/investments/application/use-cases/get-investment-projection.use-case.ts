import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentStateService } from '../services/investment-state.service';

/** Caso de uso para consultar proyección de una inversión */
@Injectable()
export class GetInvestmentProjectionUseCase {
  private readonly port = inject(INVESTMENT_PORT);
  private readonly state = inject(InvestmentStateService);

  /**
   * Carga proyección por ID y actualiza el estado.
   */
  execute(id: string): void {
    console.log('[GetInvestmentProjectionUseCase] execute()', id);
    this.port.getProjection(id).pipe(
      tap(projection => this.state.setProjection(projection)),
    ).subscribe({
      error: (err) => {
        console.warn('[GetInvestmentProjectionUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar proyección');
      },
    });
  }
}
