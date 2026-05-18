import { Injectable, inject } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { DEBT_PORT } from '../../infrastructure/tokens/debt.token';
import { DebtStateService } from '../services/debt-state.service';
import { RegisterPaymentRequest, DebtPayment } from '../../domain/models/debt.model';

/**
 * Caso de uso: registrar un pago (regular o extraordinario) en una deuda.
 * @Injectable() sin providedIn — se provee en debts.routes.ts.
 */
@Injectable()
export class RegisterPaymentUseCase {
  private readonly port = inject(DEBT_PORT);
  private readonly state = inject(DebtStateService);

  /**
   * Registra un pago y retorna el observable del resultado.
   * @param debtId ID de la deuda
   * @param req Datos del pago
   */
  execute(debtId: string, req: RegisterPaymentRequest): Observable<DebtPayment> {
    console.log('[RegisterPaymentUseCase] execute()', debtId, req.paymentType);
    this.state.loading.set(true);
    this.state.error.set(null);
    return this.port.registerPayment(debtId, req).pipe(
      finalize(() => this.state.loading.set(false)),
    );
  }
}
