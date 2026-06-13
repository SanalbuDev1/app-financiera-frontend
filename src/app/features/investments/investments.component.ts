import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/application/services/auth-state.service';
import { InvestmentStateService } from '../../core/investments/application/services/investment-state.service';
import { ListInvestmentsUseCase } from '../../core/investments/application/use-cases/list-investments.use-case';
import { GetInvestmentUseCase } from '../../core/investments/application/use-cases/get-investment.use-case';
import { CreateInvestmentUseCase } from '../../core/investments/application/use-cases/create-investment.use-case';
import { UpdateInvestmentUseCase } from '../../core/investments/application/use-cases/update-investment.use-case';
import { DeleteInvestmentUseCase } from '../../core/investments/application/use-cases/delete-investment.use-case';
import { RegisterInvestmentContributionUseCase } from '../../core/investments/application/use-cases/register-investment-contribution.use-case';
import { ListInvestmentContributionsUseCase } from '../../core/investments/application/use-cases/list-investment-contributions.use-case';
import { GetInvestmentProjectionUseCase } from '../../core/investments/application/use-cases/get-investment-projection.use-case';
import { GetInvestmentsSummaryUseCase } from '../../core/investments/application/use-cases/get-investments-summary.use-case';
import {
  CreateInvestmentRequest,
  RegisterInvestmentContributionRequest,
  UpdateInvestmentRequest,
  Investment,
  InvestmentProductType,
  InvestmentStatus,
  InvestmentCompoundingFrequency,
} from '../../core/investments/domain/models/investment.model';

/** Filtros disponibles de estado */
const STATUS_FILTERS: InvestmentStatus[] = ['active', 'closed'];

/** Filtros disponibles por tipo de producto */
const PRODUCT_FILTERS: InvestmentProductType[] = ['ahorro', 'inversion'];

/**
 * Pantalla principal del módulo de inversiones.
 * Incluye CRUD básico, aportes, resumen y proyección.
 */
@Component({
  selector: 'app-investments',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './investments.component.html',
  styleUrl: './investments.component.scss',
})
export class InvestmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authState = inject(AuthStateService);
  private readonly state = inject(InvestmentStateService);
  private readonly listUseCase = inject(ListInvestmentsUseCase);
  private readonly getUseCase = inject(GetInvestmentUseCase);
  private readonly createUseCase = inject(CreateInvestmentUseCase);
  private readonly updateUseCase = inject(UpdateInvestmentUseCase);
  private readonly deleteUseCase = inject(DeleteInvestmentUseCase);
  private readonly registerContributionUseCase = inject(RegisterInvestmentContributionUseCase);
  private readonly listContributionsUseCase = inject(ListInvestmentContributionsUseCase);
  private readonly projectionUseCase = inject(GetInvestmentProjectionUseCase);
  private readonly summaryUseCase = inject(GetInvestmentsSummaryUseCase);

  /** Estado de sesión */
  readonly userName = this.authState.currentUser;

  /** Estado de inversiones */
  readonly investments = this.state.investments;
  readonly summary = this.state.summary;
  readonly selectedInvestment = this.state.selectedInvestment;
  readonly contributions = this.state.contributions;
  readonly projection = this.state.projection;
  readonly totalPages = this.state.totalPages;
  readonly currentPage = this.state.currentPage;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  /** Sidebar móvil */
  readonly isSidebarOpen = signal(false);

  /** Tema oscuro/claro */
  readonly isDarkTheme = signal(false);

  /** Items de navegación lateral (misma estructura del dashboard/deudas) */
  readonly navItems: { icon: string; label: string; active: boolean; action: () => void }[] = [
    { icon: '🏠', label: 'Inicio',      active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '💰', label: 'Ingresos',    active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '💸', label: 'Gastos',      active: false, action: () => { this.router.navigate(['/dashboard']); this.closeSidebar(); } },
    { icon: '🏦', label: 'Deudas',      active: false, action: () => { this.router.navigate(['/debts']); this.closeSidebar(); } },
    { icon: '📈', label: 'Inversiones', active: true,  action: () => { this.router.navigate(['/investments']); this.closeSidebar(); } },
    { icon: '📊', label: 'Reportes',    active: false, action: () => {} },
  ];

  /** Filtros de listado */
  readonly selectedStatus = signal<InvestmentStatus | ''>('');
  readonly selectedProductType = signal<InvestmentProductType | ''>('');
  readonly pageSize = signal(10);

  /** Catálogos para el template */
  readonly statusFilters = STATUS_FILTERS;
  readonly productFilters = PRODUCT_FILTERS;
  readonly statuses: InvestmentStatus[] = ['active', 'closed'];
  readonly productTypes: InvestmentProductType[] = ['ahorro', 'inversion'];
  readonly compoundingOptions: InvestmentCompoundingFrequency[] = ['monthly', 'quarterly', 'yearly'];

  /** Formulario para crear o editar inversión */
  readonly investmentForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    productType: 'inversion' as InvestmentProductType,
    compoundingFrequency: 'monthly' as InvestmentCompoundingFrequency,
    initialAmount: [0, [Validators.required, Validators.min(1)]],
    annualRate: [0, [Validators.required, Validators.min(0)]],
    startDate: ['', [Validators.required]],
    targetDate: ['', [Validators.required]],
    status: 'active' as InvestmentStatus,
    notes: '',
  });

  /** Formulario para registrar aportes */
  readonly contributionForm = this.fb.nonNullable.group({
    contributionDate: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(1)]],
    contributionType: 'regular' as 'regular' | 'extra',
    notes: '',
  });

  /** Indica si el formulario está en modo edición */
  readonly isEditing = computed(() => this.selectedInvestment() !== null);

  /** Total de páginas legibles para paginación (1-indexed) */
  readonly pages = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i));

  /** Resumen saneado para evitar NaN cuando el backend retorna valores nulos o faltantes */
  readonly summaryView = computed(() => {
    const s = this.summary();
    return {
      totalInvestments: this.toNumber(s.totalInvestments),
      totalCurrentAmount: this.toNumber(s.totalCurrentAmount),
      totalContributions: this.toNumber(s.totalContributions),
      totalProjectedGain: this.toNumber(s.totalProjectedGain),
    };
  });

  ngOnInit(): void {
    console.log('[InvestmentsComponent] ngOnInit()');
    this.loadPage(0);
    this.summaryUseCase.execute();
    this.listUseCase.loadAll();
  }

  /**
   * Carga una página de inversiones aplicando filtros activos.
   */
  loadPage(page: number): void {
    this.listUseCase.execute({
      page,
      size: this.pageSize(),
      status: this.selectedStatus() || undefined,
      productType: this.selectedProductType() || undefined,
    });
  }

  /**
   * Aplica filtros y reinicia a la primera página.
   */
  onFilterChange(): void {
    console.log('[InvestmentsComponent] onFilterChange()', {
      status: this.selectedStatus(),
      productType: this.selectedProductType(),
    });
    this.loadPage(0);
  }

  /**
   * Actualiza filtro de estado desde el template.
   */
  onStatusFilterChange(value: string): void {
    this.selectedStatus.set((value as InvestmentStatus | '') || '');
    this.onFilterChange();
  }

  /**
   * Actualiza filtro de tipo de producto desde el template.
   */
  onProductFilterChange(value: string): void {
    this.selectedProductType.set((value as InvestmentProductType | '') || '');
    this.onFilterChange();
  }

  /**
   * Selecciona una inversión y carga su detalle asociado.
   */
  selectInvestment(investment: Investment): void {
    console.log('[InvestmentsComponent] selectInvestment()', investment.id);
    this.getUseCase.execute(investment.id).subscribe({
      next: (item) => {
        this.state.setSelectedInvestment(item);
        this.patchFormForEdit(item);
        this.listContributionsUseCase.execute(item.id);
        this.projectionUseCase.execute(item.id);
      },
      error: (err) => {
        console.warn('[InvestmentsComponent] selectInvestment() ← error', err);
        this.state.error.set(err?.message ?? 'No se pudo cargar la inversión');
      },
    });
  }

  /**
   * Limpia selección actual y resetea formularios.
   */
  clearSelection(): void {
    console.log('[InvestmentsComponent] clearSelection()');
    this.state.setSelectedInvestment(null);
    this.state.setContributions([]);
    this.state.setProjection(null);
    this.investmentForm.reset({
      name: '',
      productType: 'inversion',
      compoundingFrequency: 'monthly',
      initialAmount: 0,
      annualRate: 0,
      startDate: '',
      targetDate: '',
      status: 'active',
      notes: '',
    });
    this.contributionForm.reset({
      contributionDate: '',
      amount: 0,
      contributionType: 'regular',
      notes: '',
    });
  }

  /**
   * Envía create o update según el modo actual.
   */
  onSubmitInvestment(): void {
    if (this.investmentForm.invalid) {
      this.investmentForm.markAllAsTouched();
      return;
    }

    const selected = this.selectedInvestment();
    if (selected) {
      const payload: UpdateInvestmentRequest = {
        name: this.investmentForm.getRawValue().name,
        compoundingFrequency: this.investmentForm.getRawValue().compoundingFrequency,
        annualRate: this.investmentForm.getRawValue().annualRate,
        targetDate: this.investmentForm.getRawValue().targetDate,
        status: this.investmentForm.getRawValue().status,
        notes: this.investmentForm.getRawValue().notes || undefined,
      };

      this.updateUseCase.execute(selected.id, payload).subscribe({
        next: () => this.afterMutation(selected.id),
        error: (err) => this.handleMutationError(err),
      });
      return;
    }

    const payload: CreateInvestmentRequest = {
      name: this.investmentForm.getRawValue().name,
      productType: this.investmentForm.getRawValue().productType,
      compoundingFrequency: this.investmentForm.getRawValue().compoundingFrequency,
      initialAmount: this.investmentForm.getRawValue().initialAmount,
      annualRate: this.investmentForm.getRawValue().annualRate,
      startDate: this.investmentForm.getRawValue().startDate,
      targetDate: this.investmentForm.getRawValue().targetDate,
      notes: this.investmentForm.getRawValue().notes || undefined,
    };

    this.createUseCase.execute(payload).subscribe({
      next: () => this.afterMutation(),
      error: (err) => this.handleMutationError(err),
    });
  }

  /**
   * Elimina la inversión seleccionada.
   */
  onDeleteInvestment(): void {
    const selected = this.selectedInvestment();
    if (!selected) return;

    this.deleteUseCase.execute(selected.id).subscribe({
      next: () => this.afterMutation(),
      error: (err) => this.handleMutationError(err),
    });
  }

  /**
   * Registra un aporte para la inversión seleccionada.
   */
  onRegisterContribution(): void {
    const selected = this.selectedInvestment();
    if (!selected) return;

    if (this.contributionForm.invalid) {
      this.contributionForm.markAllAsTouched();
      return;
    }

    const payload: RegisterInvestmentContributionRequest = {
      contributionDate: this.contributionForm.getRawValue().contributionDate,
      amount: this.contributionForm.getRawValue().amount,
      contributionType: this.contributionForm.getRawValue().contributionType,
      notes: this.contributionForm.getRawValue().notes || undefined,
    };

    this.registerContributionUseCase.execute(selected.id, payload).subscribe({
      next: () => {
        this.listContributionsUseCase.execute(selected.id);
        this.projectionUseCase.execute(selected.id);
        this.summaryUseCase.execute();
        this.contributionForm.reset({
          contributionDate: '',
          amount: 0,
          contributionType: 'regular',
          notes: '',
        });
      },
      error: (err) => this.handleMutationError(err),
    });
  }

  /**
   * Alterna entre tema claro y oscuro.
   */
  toggleTheme(): void {
    this.isDarkTheme.update(v => !v);
  }

  /**
   * Navega al dashboard principal.
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Cierra sesión y redirige al login.
   */
  onLogout(): void {
    this.authState.clearCurrentUser();
    this.router.navigate(['/login']);
  }

  /**
   * Alterna sidebar en móvil.
   */
  toggleSidebar(): void {
    this.isSidebarOpen.update(v => !v);
  }

  /**
   * Cierra sidebar.
   */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  /**
   * Convierte un estado a etiqueta legible.
   */
  statusLabel(status: InvestmentStatus): string {
    return status === 'active' ? 'Activa' : 'Cerrada';
  }

  /**
   * Convierte frecuencia de capitalización a etiqueta legible.
   */
  frequencyLabel(freq: InvestmentCompoundingFrequency): string {
    if (freq === 'monthly') return 'Mensual';
    if (freq === 'quarterly') return 'Trimestral';
    return 'Anual';
  }

  /**
   * Formatea moneda en COP sin decimales.
   */
  formatCurrency(value: number): string {
    const safeValue = this.toNumber(value);
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(safeValue);
  }

  /**
   * Normaliza cualquier valor numérico del backend a número seguro.
   */
  private toNumber(value: unknown): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Completa el formulario con los datos de la inversión seleccionada.
   */
  private patchFormForEdit(investment: Investment): void {
    this.investmentForm.patchValue({
      name: investment.name,
      productType: investment.productType,
      compoundingFrequency: investment.compoundingFrequency,
      initialAmount: investment.initialAmount,
      annualRate: investment.annualRate,
      startDate: investment.startDate,
      targetDate: investment.targetDate,
      status: investment.status,
      notes: investment.notes ?? '',
    });
  }

  /**
   * Recarga datos tras una mutación de inversión.
   */
  private afterMutation(investmentId?: string): void {
    this.summaryUseCase.execute();
    this.listUseCase.loadAll();
    this.loadPage(this.currentPage());

    if (investmentId) {
      this.getUseCase.execute(investmentId).subscribe({
        next: (item) => {
          this.state.setSelectedInvestment(item);
          this.patchFormForEdit(item);
          this.listContributionsUseCase.execute(item.id);
          this.projectionUseCase.execute(item.id);
        },
        error: (err) => {
          console.warn('[InvestmentsComponent] afterMutation() ← error al recargar detalle', err);
        },
      });
      return;
    }

    this.clearSelection();
  }

  /**
   * Manejo centralizado de errores de mutación.
   */
  private handleMutationError(err: unknown): void {
    console.warn('[InvestmentsComponent] mutation error', err);
    const msg =
      typeof err === 'object' && err && 'error' in err
        ? ((err as { error?: { message?: string } }).error?.message ?? 'Error al procesar la operación')
        : 'Error al procesar la operación';
    this.state.error.set(msg);
  }
}
