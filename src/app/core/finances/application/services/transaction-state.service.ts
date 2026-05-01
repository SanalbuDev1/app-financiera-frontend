import { Injectable, signal, computed } from '@angular/core';
import { Transaction } from '../../domain/models/transaction.model';
import { FinancialSummary } from '../../domain/models/summary.model';
import { PaginatedResponse } from '../../domain/ports/transaction.port';

/**
 * Servicio de estado global de transacciones.
 * Almacena en signals los datos financieros del usuario autenticado.
 * Singleton: providedIn: 'root'.
 */
@Injectable({ providedIn: 'root' })
export class TransactionStateService {
  /** Transacciones de la página actual */
  readonly transactions = signal<Transaction[]>([]);

  /** Todas las transacciones del usuario (sin paginación), para gráficos y análisis */
  readonly allTransactions = signal<Transaction[]>([]);

  /** Total de registros (para paginación) */
  readonly totalElements = signal(0);

  /** Total de páginas */
  readonly totalPages = signal(1);

  /** Página actual (1-indexed) */
  readonly currentPage = signal(1);

  /** Resumen financiero del mes */
  readonly summary = signal<FinancialSummary>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    savingsGoal: 3000,
  });

  /** Indica si se está cargando datos */
  readonly loading = signal(false);

  /** Error del último request */
  readonly error = signal<string | null>(null);

  /** True si hay datos cargados */
  readonly hasData = computed(() => this.transactions().length > 0);

  /**
   * Actualiza el estado con la respuesta paginada del adaptador.
   */
  setPaginatedTransactions(response: PaginatedResponse<Transaction>): void {
    console.log('[TransactionStateService] setPaginatedTransactions()', {
      page: response.page,
      total: response.totalElements,
    });
    this.transactions.set(response.content);
    this.totalElements.set(response.totalElements);
    this.totalPages.set(response.totalPages);
    this.currentPage.set(response.page);
  }

  /**
   * Actualiza el resumen financiero.
   */
  setSummary(summary: FinancialSummary): void {
    console.log('[TransactionStateService] setSummary()', { balance: summary.totalBalance });
    this.summary.set(summary);
  }

  /**
   * Almacena todas las transacciones del usuario (para gráficos y análisis).
   */
  setAllTransactions(list: Transaction[]): void {
    console.log('[TransactionStateService] setAllTransactions()', { count: list.length });
    this.allTransactions.set(list);
  }

  /**
   * Agrega una transacción al inicio de la lista local (optimistic update).
   */
  addTransaction(tx: Transaction): void {
    console.log('[TransactionStateService] addTransaction()', tx.id);
    this.transactions.update(list => [tx, ...list]);
    this.totalElements.update(n => n + 1);
  }

  /**
   * Reemplaza una transacción existente en la lista local (optimistic update).
   */
  updateTransaction(updated: Transaction): void {
    console.log('[TransactionStateService] updateTransaction()', updated.id);
    this.transactions.update(list => list.map(tx => tx.id === updated.id ? updated : tx));
  }

  /**
   * Elimina una transacción de la lista local (optimistic update).
   */
  removeTransaction(id: string): void {
    console.log('[TransactionStateService] removeTransaction()', id);
    this.transactions.update(list => list.filter(tx => tx.id !== id));
    this.totalElements.update(n => Math.max(0, n - 1));
  }

  /**
   * Limpia todo el estado (por ejemplo al hacer logout).
   */
  clear(): void {
    console.log('[TransactionStateService] clear()');
    this.transactions.set([]);
    this.allTransactions.set([]);
    this.totalElements.set(0);
    this.totalPages.set(1);
    this.currentPage.set(1);
    this.summary.set({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      monthlySavings: 0,
      savingsGoal: 3000,
    });
    this.loading.set(false);
    this.error.set(null);
  }
}
