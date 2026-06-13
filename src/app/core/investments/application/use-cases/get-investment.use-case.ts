import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Investment } from '../../domain/models/investment.model';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentStateService } from '../services/investment-state.service';

/** Caso de uso para consultar una inversión por ID */
@Injectable()
export class GetInvestmentUseCase {
  private readonly port = inject(INVESTMENT_PORT);
  private readonly state = inject(InvestmentStateService);

  /**
   * Obtiene una inversión por ID y la guarda como seleccionada.
   */
  execute(id: string): Observable<Investment> {
    console.log('[GetInvestmentUseCase] execute()', id);
    return this.port.getById(id).pipe(
      tap(investment => this.state.setSelectedInvestment(investment)),
    );
  }
}
