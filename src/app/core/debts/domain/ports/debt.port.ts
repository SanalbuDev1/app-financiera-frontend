import { Observable } from 'rxjs';
import {
  Debt,
  DebtDetail,
  DebtPayment,
  DebtScheduleItem,
  DebtSummary,
  CreateDebtRequest,
  UpdateDebtRequest,
  RegisterPaymentRequest,
} from '../models/debt.model';

/**
 * Puerto del dominio de deudas.
 * Define el contrato que deben implementar todos los adaptadores.
 * Sin dependencias de Angular — solo TypeScript puro.
 */
export interface DebtPort {
  /** Obtiene todas las deudas del usuario, con filtro opcional de estado */
  getAll(status?: string): Observable<Debt[]>;

  /** Obtiene el detalle completo de una deuda (deuda + cronograma de amortización) */
  getDetail(id: string): Observable<DebtDetail>;

  /** Obtiene el resumen global de deudas del usuario */
  getSummary(): Observable<DebtSummary>;

  /** Crea una nueva deuda */
  create(req: CreateDebtRequest): Observable<Debt>;

  /** Actualiza los datos editables de una deuda existente */
  update(id: string, req: UpdateDebtRequest): Observable<Debt>;

  /** Elimina una deuda por ID */
  delete(id: string): Observable<void>;

  /** Registra un pago (regular o extraordinario) en una deuda */
  registerPayment(id: string, req: RegisterPaymentRequest): Observable<DebtPayment>;

  /** Obtiene el cronograma de amortización de una deuda */
  getSchedule(id: string): Observable<DebtScheduleItem[]>;
}
