import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';

/** Caso de uso para eliminar inversiones */
@Injectable()
export class DeleteInvestmentUseCase {
  private readonly port = inject(INVESTMENT_PORT);

  /**
   * Elimina una inversión por ID.
   */
  execute(id: string): Observable<void> {
    console.log('[DeleteInvestmentUseCase] execute()', id);
    return this.port.delete(id).pipe(
      tap(() => console.log('[DeleteInvestmentUseCase] execute() ← eliminada', id)),
    );
  }
}
