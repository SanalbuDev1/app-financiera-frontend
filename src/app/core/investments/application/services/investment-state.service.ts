import { Injectable, computed, signal } from '@angular/core';
import {
  Investment,
  InvestmentsSummary,
  InvestmentProjection,
  InvestmentContribution,
} from '../../domain/models/investment.model';
import { PaginatedResponse } from '../../domain/ports/investment.port';

/**
 * Estado global del módulo de inversiones.
 * Guarda listas, resumen, detalle seleccionado y metadatos de carga.
 */
@Injectable({ providedIn: 'root' })
export class InvestmentStateService {
  /** Inversiones de la página actual */
  readonly investments = signal<Investment[]>([]);

  /** Todas las inversiones sin paginar (para analíticas) */
  readonly allInvestments = signal<Investment[]>([]);

  /** Resumen agregado */
  readonly summary = signal<InvestmentsSummary>({
    totalInvestments: 0,
    activeInvestments: 0,
    closedInvestments: 0,
    totalInitialAmount: 0,
    totalCurrentAmount: 0,
    totalContributions: 0,
    totalProjectedGain: 0,
  });

  /** Inversión seleccionada */
  readonly selectedInvestment = signal<Investment | null>(null);

  /** Aportes de la inversión seleccionada */
  readonly contributions = signal<InvestmentContribution[]>([]);

  /** Proyección de la inversión seleccionada */
  readonly projection = signal<InvestmentProjection | null>(null);

  /** Paginación */
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly currentPage = signal(0);

  /** UX state */
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** True cuando hay al menos una inversión cargada */
  readonly hasData = computed(() => this.investments().length > 0);

  /** Actualiza el estado con respuesta paginada */
  setPaginatedInvestments(response: PaginatedResponse<Investment>): void {
    console.log('[InvestmentStateService] setPaginatedInvestments()', {
      page: response.page,
      total: response.totalElements,
    });
    this.investments.set(response.content);
    this.totalElements.set(response.totalElements);
    this.totalPages.set(response.totalPages);
    this.currentPage.set(response.page);
  }

  /** Actualiza la colección completa sin paginar */
  setAllInvestments(list: Investment[]): void {
    console.log('[InvestmentStateService] setAllInvestments()', { count: list.length });
    this.allInvestments.set(list);
  }

  /** Actualiza resumen */
  setSummary(summary: InvestmentsSummary): void {
    console.log('[InvestmentStateService] setSummary()');
    this.summary.set(summary);
  }

  /** Actualiza inversión seleccionada */
  setSelectedInvestment(investment: Investment | null): void {
    console.log('[InvestmentStateService] setSelectedInvestment()', investment?.id ?? null);
    this.selectedInvestment.set(investment);
  }

  /** Actualiza aportes */
  setContributions(contributions: InvestmentContribution[]): void {
    console.log('[InvestmentStateService] setContributions()', { count: contributions.length });
    this.contributions.set(contributions);
  }

  /** Actualiza proyección */
  setProjection(projection: InvestmentProjection | null): void {
    console.log('[InvestmentStateService] setProjection()', projection?.investmentId ?? null);
    this.projection.set(projection);
  }

  /** Limpia estado del módulo */
  clear(): void {
    console.log('[InvestmentStateService] clear()');
    this.investments.set([]);
    this.allInvestments.set([]);
    this.summary.set({
      totalInvestments: 0,
      activeInvestments: 0,
      closedInvestments: 0,
      totalInitialAmount: 0,
      totalCurrentAmount: 0,
      totalContributions: 0,
      totalProjectedGain: 0,
    });
    this.selectedInvestment.set(null);
    this.contributions.set([]);
    this.projection.set(null);
    this.totalElements.set(0);
    this.totalPages.set(1);
    this.currentPage.set(0);
    this.loading.set(false);
    this.error.set(null);
  }
}
