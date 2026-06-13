import { Injectable, inject } from '@angular/core';
import { tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentStateService } from '../services/investment-state.service';

/** Caso de uso para listar aportes de una inversión */
@Injectable()
export class ListInvestmentContributionsUseCase {
  private readonly port = inject(INVESTMENT_PORT);
  private readonly state = inject(InvestmentStateService);

  /**
   * Carga aportes por ID de inversión y actualiza el estado.
   */
  execute(id: string): void {
    console.log('[ListInvestmentContributionsUseCase] execute()', id);
    this.port.getContributions(id).pipe(
      tap(contributions => this.state.setContributions(contributions)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListInvestmentContributionsUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar aportes');
      },
    });
  }
}
