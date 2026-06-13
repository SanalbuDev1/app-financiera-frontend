import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { CreateInvestmentRequest, Investment } from '../../domain/models/investment.model';

/** Caso de uso para crear inversiones */
@Injectable()
export class CreateInvestmentUseCase {
  private readonly port = inject(INVESTMENT_PORT);

  /**
   * Crea una nueva inversión.
   */
  execute(req: CreateInvestmentRequest): Observable<Investment> {
    console.log('[CreateInvestmentUseCase] execute()', req.name);
    return this.port.create(req).pipe(
      tap(investment => console.log('[CreateInvestmentUseCase] execute() ← creada', investment.id)),
    );
  }
}
