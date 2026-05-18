import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
} from '../../domain/models/debt.model';
import { DebtPort } from '../../domain/ports/debt.port';
import { environment } from '../../../../../environments/environment';

/**
 * Adaptador HTTP que implementa DebtPort conectándose al backend Java Spring Boot.
 * Se activa con `{ provide: DEBT_PORT, useClass: JavaDebtAdapter }` en app.config.ts.
 * Endpoints base: /api/debts
 */
@Injectable()
export class JavaDebtAdapter implements DebtPort {
  /** URL base del microservicio de deudas */
  private readonly baseUrl = `${environment.apiUrl}/api/debts`;

  constructor(private readonly http: HttpClient) {}

  /**
   * GET /api/debts?status=... — Obtiene todas las deudas del usuario.
   */
  getAll(status?: string): Observable<Debt[]> {
    console.log('[JavaDebtAdapter] getAll()', { status });
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<Debt[]>(this.baseUrl, { params });
  }

  /**
   * GET /api/debts/{id} — Obtiene el detalle de una deuda con su cronograma.
   */
  getDetail(id: string): Observable<DebtDetail> {
    console.log('[JavaDebtAdapter] getDetail()', id);
    return this.http.get<DebtDetail>(`${this.baseUrl}/${id}`);
  }

  /**
   * GET /api/debts/summary — Obtiene el resumen global de deudas.
   */
  getSummary(): Observable<DebtSummary> {
    console.log('[JavaDebtAdapter] getSummary()');
    return this.http.get<DebtSummary>(`${this.baseUrl}/summary`);
  }

  /**
   * POST /api/debts — Crea una nueva deuda.
   */
  create(req: CreateDebtRequest): Observable<Debt> {
    console.log('[JavaDebtAdapter] create()', req.creditor);
    return this.http.post<Debt>(this.baseUrl, req);
  }

  /**
   * PUT /api/debts/{id} — Actualiza los datos editables de una deuda.
   */
  update(id: string, req: UpdateDebtRequest): Observable<Debt> {
    console.log('[JavaDebtAdapter] update()', id);
    return this.http.put<Debt>(`${this.baseUrl}/${id}`, req);
  }

  /**
   * DELETE /api/debts/{id} — Elimina una deuda.
   */
  delete(id: string): Observable<void> {
    console.log('[JavaDebtAdapter] delete()', id);
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * POST /api/debts/{id}/payments — Registra un pago en una deuda.
   */
  registerPayment(id: string, req: RegisterPaymentRequest): Observable<DebtPayment> {
    console.log('[JavaDebtAdapter] registerPayment()', id, req.paymentType);
    return this.http.post<DebtPayment>(`${this.baseUrl}/${id}/payments`, req);
  }

  /**
   * GET /api/debts/{id}/schedule — Obtiene el cronograma de amortización.
   */
  getSchedule(id: string): Observable<DebtScheduleItem[]> {
    console.log('[JavaDebtAdapter] getSchedule()', id);
    return this.http.get<DebtScheduleItem[]>(`${this.baseUrl}/${id}/schedule`);
  }
}
