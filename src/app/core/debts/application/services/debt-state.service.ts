import { Injectable, signal, computed } from '@angular/core';
import { Debt, DebtSummary, DebtDetail } from '../../domain/models/debt.model';

/**
 * Servicio de estado global de deudas.
 * Almacena en signals los datos de deudas del usuario autenticado.
 * Singleton: providedIn: 'root'.
 */
@Injectable({ providedIn: 'root' })
export class DebtStateService {
  /** Lista de deudas del usuario */
  readonly debts = signal<Debt[]>([]);

  /** Resumen global de deudas */
  readonly summary = signal<DebtSummary>({
    totalDebts: 0,
    totalBalance: 0,
    totalOriginalAmount: 0,
    totalMonthlyPayment: 0,
    totalPendingInterest: 0,
    averageProgress: 0,
  });

  /** Detalle completo de la deuda seleccionada (incluye cronograma) */
  readonly currentDetail = signal<DebtDetail | null>(null);

  /** Indica si se está cargando datos */
  readonly loading = signal(false);

  /** Error del último request */
  readonly error = signal<string | null>(null);

  /** True si hay deudas cargadas */
  readonly hasData = computed(() => this.debts().length > 0);

  /**
   * Actualiza la lista de deudas en el estado global.
   */
  setDebts(debts: Debt[]): void {
    console.log('[DebtStateService] setDebts()', debts.length);
    this.debts.set(debts);
  }

  /**
   * Actualiza el resumen global de deudas.
   */
  setSummary(summary: DebtSummary): void {
    console.log('[DebtStateService] setSummary()');
    this.summary.set(summary);
  }

  /**
   * Actualiza el detalle de la deuda actualmente seleccionada.
   */
  setCurrentDetail(detail: DebtDetail): void {
    console.log('[DebtStateService] setCurrentDetail()', detail.debt.id);
    this.currentDetail.set(detail);
  }

  /**
   * Limpia todos los datos de deudas del estado (al cerrar sesión).
   */
  clear(): void {
    console.log('[DebtStateService] clear()');
    this.debts.set([]);
    this.summary.set({
      totalDebts: 0,
      totalBalance: 0,
      totalOriginalAmount: 0,
      totalMonthlyPayment: 0,
      totalPendingInterest: 0,
      averageProgress: 0,
    });
    this.currentDetail.set(null);
    this.error.set(null);
  }
}
