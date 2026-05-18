import { Injectable, inject } from '@angular/core';
import { tap, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';

/**
 * Caso de uso: listar deudas del usuario con filtro opcional de estado.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class ListDebtsUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Ejecuta la consulta de deudas y actualiza el estado global.
   * @param status Filtro: 'active' | 'paid_off' | 'defaulted' | undefined (todos)
   */
  execute(status?: string): void {
    console.log('[ListDebtsUseCase] execute()', { status });
    this.state.loading.set(true);
    this.state.error.set(null);

    this.port.getAll(status).pipe(
      tap(debts => this.state.setDebts(debts)),
      finalize(() => this.state.loading.set(false)),
    ).subscribe({
      error: (err) => {
        console.warn('[ListDebtsUseCase] execute() ← error', err);
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
