import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DebtStateService } from '../../../core/debts/application/services/debt-state.service';
import { ListDebtsUseCase } from '../../../core/debts/application/use-cases/list-debts.use-case';
import { GetDebtSummaryUseCase } from '../../../core/debts/application/use-cases/get-debt-summary.use-case';
import { CreateDebtUseCase } from '../../../core/debts/application/use-cases/create-debt.use-case';
import { Debt, CreateDebtRequest, getDebtTypeIcon } from '../../../core/debts/domain/models/debt.model';
import { CreateDebtModalComponent } from '../create-debt-modal/create-debt-modal.component';

/** Opciones del filtro de estado */
const STATUS_FILTERS: { value: string | undefined; label: string; icon: string }[] = [
  { value: undefined,    label: 'Todas',     icon: '📋' },
  { value: 'active',     label: 'Activas',   icon: '🟢' },
  { value: 'paid_off',   label: 'Pagadas',   icon: '✅' },
  { value: 'defaulted',  label: 'En mora',   icon: '🔴' },
];

/**
 * Componente de la lista de deudas.
 * Muestra tarjetas de resumen, filtro por estado y grid de tarjetas de deuda.
 */
@Component({
  selector: 'app-debt-list',
  standalone: true,
  imports: [CommonModule, CreateDebtModalComponent],
  templateUrl: './debt-list.component.html',
  styleUrl: './debt-list.component.scss',
})
export class DebtListComponent implements OnInit {
  private readonly state = inject(DebtStateService);
  private readonly listDebtsUseCase = inject(ListDebtsUseCase);
  private readonly getSummaryUseCase = inject(GetDebtSummaryUseCase);
  private readonly createDebtUseCase = inject(CreateDebtUseCase);
  private readonly router = inject(Router);

  /** Estado global (signals) */
  readonly debts = this.state.debts;
  readonly summary = this.state.summary;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  /** Opciones de filtro */
  readonly statusFilters = STATUS_FILTERS;

  /** Filtro de estado activo */
  readonly activeFilter = signal<string | undefined>(undefined);

  /** Modal de nueva deuda */
  readonly isCreateModalOpen = signal(false);

  /** Deudas filtradas por el estado activo */
  readonly filteredDebts = computed(() => {
    const filter = this.activeFilter();
    const all = this.debts();
    if (!filter) return all;
    return all.filter(d => d.status === filter);
  });

  /** Función de utilidad para obtener el ícono del tipo de deuda */
  readonly getDebtTypeIcon = getDebtTypeIcon;

  ngOnInit(): void {
    console.log('[DebtListComponent] ngOnInit()');
    this.loadAll();
  }

  /**
   * Carga deudas y resumen en paralelo.
   */
  loadAll(): void {
    this.listDebtsUseCase.execute();
    this.getSummaryUseCase.execute();
  }

  /**
   * Aplica el filtro de estado y recarga la vista.
   */
  setFilter(value: string | undefined): void {
    console.log('[DebtListComponent] setFilter()', value);
    this.activeFilter.set(value);
  }

  /**
   * Navega al detalle de la deuda seleccionada.
   */
  onDebtClick(debt: Debt): void {
    console.log('[DebtListComponent] onDebtClick()', debt.id);
    this.router.navigate(['/debts', debt.id]);
  }

  /**
   * Maneja la creación exitosa de una deuda: cierra el modal y recarga.
   */
  onDebtCreated(_debt: Debt): void {
    console.log('[DebtListComponent] onDebtCreated()');
    this.isCreateModalOpen.set(false);
    this.loadAll();
  }

  /**
   * Cierra el modal de creación.
   */
  onCreateModalClosed(): void {
    this.isCreateModalOpen.set(false);
  }

  /**
   * Submits a create request forwarded from the modal.
   */
  onCreateSubmit(req: CreateDebtRequest): void {
    console.log('[DebtListComponent] onCreateSubmit()', req.creditor);
    this.createDebtUseCase.execute(req).subscribe({
      next: (debt) => this.onDebtCreated(debt),
      error: (err) => {
        const e = err as { status?: number; error?: { message?: string } };
        const msg =
          e?.status === 400 ? (e?.error?.message ?? 'Datos inválidos') :
          e?.status === 422 ? 'Error de validación en el servidor' :
          'Error inesperado, intenta de nuevo';
        this.state.error.set(msg);
      },
    });
  }

  /**
   * Formatea un número como moneda sin símbolo.
   */
  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Formatea una fecha 'YYYY-MM-DD' a 'DD MMM YYYY' en español.
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /**
   * Retorna la clase CSS según el estado de la deuda.
   */
  statusClass(status: string): string {
    const map: Record<string, string> = {
      active:   'badge--active',
      paid_off: 'badge--paid',
      defaulted: 'badge--defaulted',
    };
    return map[status] ?? '';
  }

  /**
   * Retorna la cantidad de deudas para un filtro de estado dado.
   */
  getFilterCount(status: string | undefined): number {
    if (status === undefined) return this.debts().length;
    return this.debts().filter(d => d.status === status).length;
  }

  /**
   * Retorna el texto legible del estado de la deuda.
   */
  statusLabel(status: string): string {
    const map: Record<string, string> = {
      active:    'Activa',
      paid_off:  'Pagada',
      defaulted: 'En mora',
    };
    return map[status] ?? status;
  }
}
