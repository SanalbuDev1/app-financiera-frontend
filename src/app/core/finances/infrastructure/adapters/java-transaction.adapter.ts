import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { Transaction } from '../../domain/models/transaction.model';
import { FinancialSummary } from '../../domain/models/summary.model';
import {
  TransactionPort,
  TransactionFilter,
  PaginatedResponse,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../../domain/ports/transaction.port';
import { environment } from '../../../../../environments/environment';

/**
 * Adaptador HTTP que implementa TransactionPort conectándose al backend Java Spring Boot.
 * Se activa cambiando `useClass: JavaTransactionAdapter` en app.config.ts.
 * Endpoints: /api/transactions | /api/transactions/summary
 */
@Injectable()
export class JavaTransactionAdapter implements TransactionPort {
  /** URL base del microservicio de transacciones */
  private readonly baseUrl = `${environment.apiUrl}/api/transactions`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Parsea una fecha del backend como hora local.
   * Cuando el backend devuelve solo "YYYY-MM-DD" (sin hora), new Date() lo interpreta como UTC,
   * causando un desfase de día en zonas horarias negativas (e.g. UTC-5).
   * Se agrega "T00:00:00" para forzar interpretación en hora local.
   */
  private parseLocalDate(value: string | Date): Date {
    if (value instanceof Date) return value;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(value + 'T00:00:00');
    }
    return new Date(value);
  }

  /**
   * Obtiene transacciones paginadas con filtros opcionales.
   * GET /api/transactions?from=&to=&type=&page=&size=
   */
  getAll(filter: TransactionFilter): Observable<PaginatedResponse<Transaction>> {
    console.log('[JavaTransactionAdapter] getAll()', filter);
    let params = new HttpParams();
    if (filter.from) params = params.set('from', filter.from);
    if (filter.to) params = params.set('to', filter.to);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.page) params = params.set('page', String(filter.page - 1)); // backend 0-indexed
    if (filter.size) params = params.set('size', String(filter.size));

    return this.http.get<PaginatedResponse<Transaction>>(this.baseUrl, { params }).pipe(
      map(res => ({
        ...res,
        content: res.content.map(tx => ({
          ...tx,
          date: this.parseLocalDate(tx.date as unknown as string),
          createdAt: tx.createdAt ? new Date(tx.createdAt) : undefined,
        })),
      })),
      tap(res => console.log(`[JavaTransactionAdapter] getAll() ← ${res.totalElements} registros`)),
    );
  }

  /**
   * Obtiene todas las transacciones del usuario sin paginación.
   * GET /api/transactions/all
   */
  getAllNoPagination(): Observable<Transaction[]> {
    console.log('[JavaTransactionAdapter] getAllNoPagination()');
    return this.http.get<Transaction[]>(`${this.baseUrl}/all`).pipe(
      map(list => list.map(tx => ({
        ...tx,
        date: this.parseLocalDate(tx.date as unknown as string),
        createdAt: tx.createdAt ? new Date(tx.createdAt) : undefined,
      }))),
      tap(list => console.log(`[JavaTransactionAdapter] getAllNoPagination() ← ${list.length} registros`)),
    );
  }

  /**
   * Obtiene el resumen financiero del mes/año indicado.
   * GET /api/transactions/summary?month=&year=
   */
  getSummary(month: number, year: number): Observable<FinancialSummary> {
    console.log('[JavaTransactionAdapter] getSummary()', { month, year });
    const params = new HttpParams()
      .set('month', String(month))
      .set('year', String(year));

    return this.http.get<FinancialSummary>(`${this.baseUrl}/summary`, { params }).pipe(
      tap(s => console.log('[JavaTransactionAdapter] getSummary() ← balance', s.totalBalance)),
    );
  }

  /**
   * Crea una nueva transacción (ingreso o gasto).
   * POST /api/transactions
   */
  create(dto: CreateTransactionDto): Observable<Transaction> {
    console.log('[JavaTransactionAdapter] create()', dto);
    return this.http.post<Transaction>(this.baseUrl, dto).pipe(
      map(tx => ({ ...tx, date: this.parseLocalDate(tx.date as unknown as string), createdAt: tx.createdAt ? new Date(tx.createdAt) : undefined })),
      tap(tx => console.log('[JavaTransactionAdapter] create() ← id:', tx.id)),
    );
  }

  /**
   * Actualiza una transacción existente por ID.
   * PUT /api/transactions/:id
   */
  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    console.log('[JavaTransactionAdapter] update()', { id, dto });
    return this.http.put<Transaction>(`${this.baseUrl}/${id}`, dto).pipe(
      map(tx => ({ ...tx, date: this.parseLocalDate(tx.date as unknown as string), createdAt: tx.createdAt ? new Date(tx.createdAt) : undefined })),
      tap(tx => console.log('[JavaTransactionAdapter] update() ← id:', tx.id)),
    );
  }

  /**
   * Elimina una transacción por ID.
   * DELETE /api/transactions/:id
   */
  delete(id: string): Observable<void> {
    console.log('[JavaTransactionAdapter] delete()', id);
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => console.log('[JavaTransactionAdapter] delete() ← eliminado')),
    );
  }
}
