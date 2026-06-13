import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentContribution, RegisterInvestmentContributionRequest } from '../../domain/models/investment.model';

/** Caso de uso para registrar aportes en una inversión */
@Injectable()
export class RegisterInvestmentContributionUseCase {
  private readonly port = inject(INVESTMENT_PORT);

  /**
   * Registra un aporte regular o extraordinario.
   */
  execute(id: string, req: RegisterInvestmentContributionRequest): Observable<InvestmentContribution> {
    console.log('[RegisterInvestmentContributionUseCase] execute()', id, req.contributionType);
    return this.port.registerContribution(id, req).pipe(
      tap(contribution => console.log('[RegisterInvestmentContributionUseCase] execute() ← aporte registrado', contribution.id)),
    );
  }
}
