import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Investment,
  InvestmentsSummary,
  InvestmentProjection,
  InvestmentContribution,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  RegisterInvestmentContributionRequest,
} from '../../domain/models/investment.model';
import { InvestmentPort, InvestmentFilter, PaginatedResponse } from '../../domain/ports/investment.port';
import { environment } from '../../../../../environments/environment';

/**
 * Adaptador HTTP que implementa InvestmentPort contra el backend Java.
 * Endpoints base: /api/investments
 */
@Injectable()
export class JavaInvestmentAdapter implements InvestmentPort {
  /** URL base del microservicio de inversiones */
  private readonly baseUrl = `${environment.apiUrl}/api/investments`;

  constructor(private readonly http: HttpClient) {}

  /** GET /api/investments */
  getAll(filter: InvestmentFilter): Observable<PaginatedResponse<Investment>> {
    console.log('[JavaInvestmentAdapter] getAll()', filter);
    let params = new HttpParams();

    if (filter.page !== undefined) params = params.set('page', String(filter.page));
    if (filter.size !== undefined) params = params.set('size', String(filter.size));
    if (filter.productType) params = params.set('productType', filter.productType);
    if (filter.status) params = params.set('status', filter.status);

    return this.http.get<PaginatedResponse<Investment>>(this.baseUrl, { params });
  }

  /** GET /api/investments/all */
  getAllNoPagination(): Observable<Investment[]> {
    console.log('[JavaInvestmentAdapter] getAllNoPagination()');
    return this.http.get<Investment[]>(`${this.baseUrl}/all`);
  }

  /** GET /api/investments/{id} */
  getById(id: string): Observable<Investment> {
    console.log('[JavaInvestmentAdapter] getById()', id);
    return this.http.get<Investment>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/investments */
  create(req: CreateInvestmentRequest): Observable<Investment> {
    console.log('[JavaInvestmentAdapter] create()', req.name);
    return this.http.post<Investment>(this.baseUrl, req);
  }

  /** PUT /api/investments/{id} */
  update(id: string, req: UpdateInvestmentRequest): Observable<Investment> {
    console.log('[JavaInvestmentAdapter] update()', id);
    return this.http.put<Investment>(`${this.baseUrl}/${id}`, req);
  }

  /** DELETE /api/investments/{id} */
  delete(id: string): Observable<void> {
    console.log('[JavaInvestmentAdapter] delete()', id);
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** POST /api/investments/{id}/contributions */
  registerContribution(id: string, req: RegisterInvestmentContributionRequest): Observable<InvestmentContribution> {
    console.log('[JavaInvestmentAdapter] registerContribution()', id, req.contributionType);
    return this.http.post<InvestmentContribution>(`${this.baseUrl}/${id}/contributions`, req);
  }

  /** GET /api/investments/{id}/contributions */
  getContributions(id: string): Observable<InvestmentContribution[]> {
    console.log('[JavaInvestmentAdapter] getContributions()', id);
    return this.http.get<InvestmentContribution[]>(`${this.baseUrl}/${id}/contributions`);
  }

  /** GET /api/investments/{id}/projection */
  getProjection(id: string): Observable<InvestmentProjection> {
    console.log('[JavaInvestmentAdapter] getProjection()', id);
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}/${id}/projection`).pipe(
      map((raw) => this.normalizeProjection(id, raw)),
    );
  }

  /** GET /api/investments/summary */
  getSummary(): Observable<InvestmentsSummary> {
    console.log('[JavaInvestmentAdapter] getSummary()');
    return this.http.get<InvestmentsSummary>(`${this.baseUrl}/summary`);
  }

  /**
   * Normaliza la respuesta de proyección para tolerar variaciones de naming.
   */
  private normalizeProjection(id: string, raw: Record<string, unknown>): InvestmentProjection {
    const projectedAmount = this.pickNumber(raw, [
      'projectedAmount',
      'projectedValue',
      'futureValue',
      'estimatedAmount',
      'montoProyectado',
      'projected_amount',
    ]);

    const projectedGain = this.pickNumber(raw, [
      'projectedGain',
      'expectedGain',
      'estimatedGain',
      'gain',
      'rendimientoEsperado',
      'gananciaProyectada',
      'projected_gain',
    ]);

    return {
      investmentId: this.pickString(raw, ['investmentId', 'investment_id', 'id']) ?? id,
      projectedAmount,
      projectedGain,
      projectedAtTargetDate:
        this.pickString(raw, ['projectedAtTargetDate', 'projectedDate', 'targetDate', 'projectionDate', 'projected_at_target_date']) ?? '',
      monthsToTarget: this.pickNumber(raw, ['monthsToTarget', 'monthsRemaining', 'months', 'remainingMonths', 'months_to_target']),
      annualRate: this.pickNumber(raw, ['annualRate', 'rate', 'interestRate', 'annual_rate']),
    };
  }

  /** Obtiene el primer valor numérico válido de una lista de claves */
  private pickNumber(source: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
    return 0;
  }

  /** Obtiene el primer string no vacío de una lista de claves */
  private pickString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim() !== '') {
        return value;
      }
    }
    return null;
  }
}
