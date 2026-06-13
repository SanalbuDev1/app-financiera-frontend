import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentStateService } from '../services/investment-state.service';

/** Caso de uso para consultar el resumen de inversiones */
@Injectable()
export class GetInvestmentsSummaryUseCase {
  private readonly port = inject(INVESTMENT_PORT);
  private readonly state = inject(InvestmentStateService);

  /**
   * Carga el resumen agregado de inversiones.
   */
  execute(): void {
    console.log('[GetInvestmentsSummaryUseCase] execute()');
    this.port.getSummary().pipe(
      tap(summary => this.state.setSummary(summary)),
    ).subscribe({
      error: (err) => {
        console.warn('[GetInvestmentsSummaryUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar resumen de inversiones');
      },
    });
  }
}
