import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';

/**
 * Caso de uso: obtener el detalle completo de una deuda (incluye cronograma).
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class GetDebtDetailUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Carga el detalle de una deuda y actualiza el estado global.
   * @param id ID de la deuda a consultar
   */
  execute(id: string): void {
    console.log('[GetDebtDetailUseCase] execute()', id);
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.getDetail(id).pipe(
      tap(detail => this.state.setCurrentDetail(detail)),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[GetDebtDetailUseCase] execute() ← error', err);
        this.state.error.set(this.mapError(err));
      },
    });
  }

  private mapError(err: unknown): string {
    const e = err as { status?: number; error?: { message?: string } };
    if (e?.status === 404) return 'Deuda no encontrada';
    if (e?.status === 400) return e?.error?.message ?? 'Datos inválidos';
    return 'Error inesperado, intenta de nuevo';
  }
}
