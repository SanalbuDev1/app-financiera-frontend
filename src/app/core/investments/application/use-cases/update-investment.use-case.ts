import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { UpdateInvestmentRequest, Investment } from '../../domain/models/investment.model';

/** Caso de uso para actualizar inversiones */
@Injectable()
export class UpdateInvestmentUseCase {
  private readonly port = inject(INVESTMENT_PORT);

  /**
   * Actualiza una inversión existente.
   */
  execute(id: string, req: UpdateInvestmentRequest): Observable<Investment> {
    console.log('[UpdateInvestmentUseCase] execute()', id);
    return this.port.update(id, req).pipe(
      tap(investment => console.log('[UpdateInvestmentUseCase] execute() ← actualizada', investment.id)),
    );
  }
}
