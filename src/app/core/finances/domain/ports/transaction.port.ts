import { Observable } from 'rxjs';
import { Transaction, TransactionType } from '../models/transaction.model';
import { FinancialSummary } from '../models/summary.model';

/** Parámetros para consultar transacciones con filtro y paginación */
export interface TransactionFilter {
  /** Fecha de inicio del rango (ISO string YYYY-MM-DD) */
  from?: string;
  /** Fecha de fin del rango (ISO string YYYY-MM-DD) */
  to?: string;
  /** Tipo de transacción: income | expense */
  type?: TransactionType;
  /** Categoría de transacción (coincide con categories.name del backend) */
  category?: string;
  /** Página actual (1-indexed) */
  page?: number;
  /** Tamaño de página (default 15) */
  size?: number;
}

/** Respuesta paginada del backend */
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

/** DTO para crear una transacción */
export interface CreateTransactionDto {
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  transactionDate: string;
  notes?: string;
}

/** DTO para actualizar una transacción (mismo shape que crear) */
export type UpdateTransactionDto = CreateTransactionDto;

/**
 * Puerto de transacciones (interfaz del dominio).
 * Define el contrato que deben implementar todos los adaptadores de finanzas.
 * Sin dependencias de Angular — solo TypeScript puro.
 */
export interface TransactionPort {
  /** Obtiene transacciones paginadas con filtros opcionales */
  getAll(filter: TransactionFilter): Observable<PaginatedResponse<Transaction>>;

  /** Obtiene todas las transacciones del usuario sin paginación */
  getAllNoPagination(): Observable<Transaction[]>;

  /** Obtiene el resumen financiero del mes/año indicado */
  getSummary(month: number, year: number): Observable<FinancialSummary>;

  /** Crea una nueva transacción (ingreso o gasto) */
  create(dto: CreateTransactionDto): Observable<Transaction>;

  /** Actualiza una transacción existente por ID */
  update(id: string, dto: UpdateTransactionDto): Observable<Transaction>;

  /** Elimina una transacción por ID */
  delete(id: string): Observable<void>;
}
