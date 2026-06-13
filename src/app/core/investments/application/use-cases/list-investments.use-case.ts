import { Injectable, inject } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { INVESTMENT_PORT } from '../../infrastructure/tokens/investment.token';
import { InvestmentStateService } from '../services/investment-state.service';
import { InvestmentFilter } from '../../domain/ports/investment.port';

/**
 * Caso de uso para listar inversiones paginadas y sin paginación.
 * Se provee en investments.routes.ts.
 */
@Injectable()
export class ListInvestmentsUseCase {
  private readonly port = inject(INVESTMENT_PORT);
  private readonly state = inject(InvestmentStateService);

  /**
   * Obtiene la página de inversiones y actualiza estado.
   */
  execute(filter: InvestmentFilter): void {
    console.log('[ListInvestmentsUseCase] execute()', filter);
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.getAll(filter).pipe(
      tap(response => this.state.setPaginatedInvestments(response)),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListInvestmentsUseCase] execute() ← error', err);
        this.state.error.set(err?.message ?? 'Error al cargar inversiones');
      },
    });
  }

  /**
   * Obtiene todas las inversiones del usuario (sin paginación).
   */
  loadAll(): void {
    console.log('[ListInvestmentsUseCase] loadAll()');
    this.port.getAllNoPagination().pipe(
      tap(list => this.state.setAllInvestments(list)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListInvestmentsUseCase] loadAll() ← error', err);
      },
    });
  }
}
