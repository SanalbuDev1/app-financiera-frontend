import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvestmentStateService } from '../../../core/investments/application/services/investment-state.service';
import { ListInvestmentsUseCase } from '../../../core/investments/application/use-cases/list-investments.use-case';
import { GetInvestmentsSummaryUseCase } from '../../../core/investments/application/use-cases/get-investments-summary.use-case';
import { CreateInvestmentUseCase } from '../../../core/investments/application/use-cases/create-investment.use-case';
import {
  CreateInvestmentRequest,
  Investment,
  InvestmentCompoundingFrequency,
  InvestmentProductType,
  InvestmentStatus,
} from '../../../core/investments/domain/models/investment.model';

/** Filtros de estado */
const STATUS_FILTERS: { value: InvestmentStatus | undefined; label: string; icon: string }[] = [
  { value: undefined, label: 'Todas', icon: '' },
  { value: 'active', label: 'Activas', icon: '' },
  { value: 'closed', label: 'Cerradas', icon: '' },
];

/** Filtros de tipo */
const TYPE_FILTERS: { value: InvestmentProductType | undefined; label: string; icon: string }[] = [
  { value: undefined, label: 'Todos', icon: '' },
  { value: 'ahorro', label: 'Ahorro', icon: '' },
  { value: 'inversion', label: 'Inversión', icon: '' },
];

/**
 * Pantalla de listado de inversiones.
 * Similar al módulo de deudas: resumen, filtros, grid y acción de crear.
 */
@Component({
  selector: 'app-investment-list',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './investment-list.component.html',
  styleUrl: './investment-list.component.scss',
})
export class InvestmentListComponent implements OnInit {
  private readonly state = inject(InvestmentStateService);
  private readonly listUseCase = inject(ListInvestmentsUseCase);
  private readonly summaryUseCase = inject(GetInvestmentsSummaryUseCase);
  private readonly createUseCase = inject(CreateInvestmentUseCase);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Estado global */
  readonly investments = this.state.investments;
  readonly summary = this.state.summary;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  /** UI state */
  readonly isCreateOpen = signal(false);
  readonly activeStatusFilter = signal<InvestmentStatus | undefined>(undefined);
  readonly activeTypeFilter = signal<InvestmentProductType | undefined>(undefined);
  readonly initialAmountDisplay = signal('0');

  /** Catálogos */
  readonly statusFilters = STATUS_FILTERS;
  readonly typeFilters = TYPE_FILTERS;
  readonly typeOptions: InvestmentProductType[] = ['ahorro', 'inversion'];
  readonly compoundingOptions: InvestmentCompoundingFrequency[] = ['monthly', 'quarterly', 'yearly'];

  /** Formulario de creación */
  readonly createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    productType: 'inversion' as InvestmentProductType,
    compoundingFrequency: 'monthly' as InvestmentCompoundingFrequency,
    initialAmount: [0, [Validators.required, Validators.min(1)]],
    annualRate: [0, [Validators.required, Validators.min(0)]],
    startDate: '',
    targetDate: '',
    notes: '',
  });

  /** Lista filtrada por estado y tipo */
  readonly filteredInvestments = computed(() => {
    const list = this.investments();
    const status = this.activeStatusFilter();
    const type = this.activeTypeFilter();

    return list.filter(item => {
      const statusOk = !status || item.status === status;
      const typeOk = !type || item.productType === type;
      return statusOk && typeOk;
    });
  });

  ngOnInit(): void {
    console.log('[InvestmentListComponent] ngOnInit()');
    this.loadAll();
    this.initializeDateDefaults();
    this.initialAmountDisplay.set(this.formatIntegerForInput(this.createForm.getRawValue().initialAmount));
  }

  /** Carga lista y resumen */
  loadAll(): void {
    this.listUseCase.execute({ page: 0, size: 50 });
    this.summaryUseCase.execute();
  }

  /** Navega al detalle */
  openDetail(investment: Investment): void {
    this.router.navigate(['/investments', investment.id]);
  }

  /** Aplica filtro de estado */
  setStatusFilter(value: InvestmentStatus | undefined): void {
    this.activeStatusFilter.set(value);
  }

  /** Aplica filtro de tipo */
  setTypeFilter(value: InvestmentProductType | undefined): void {
    this.activeTypeFilter.set(value);
  }

  /** Envía el formulario de creación */
  onCreateSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const formValue = this.createForm.getRawValue();
    const startDate = formValue.startDate || this.getTodayDateIso();
    const targetDate = formValue.targetDate || this.buildTargetDateByFrequency(startDate, formValue.compoundingFrequency);

    const payload: CreateInvestmentRequest = {
      name: formValue.name,
      productType: formValue.productType,
      compoundingFrequency: formValue.compoundingFrequency,
      initialAmount: formValue.initialAmount,
      annualRate: formValue.annualRate,
      startDate,
      targetDate,
      notes: formValue.notes || undefined,
    };

    this.createUseCase.execute(payload).subscribe({
      next: (created) => {
        this.isCreateOpen.set(false);
        this.resetCreateForm();
        this.loadAll();
        this.router.navigate(['/investments', created.id]);
      },
      error: (err) => {
        console.warn('[InvestmentListComponent] onCreateSubmit() ← error', err);
        const e = err as { status?: number; error?: { message?: string } };
        const msg =
          e?.status === 400 ? (e?.error?.message ?? 'Datos inválidos') :
          'Error al crear inversión';
        this.state.error.set(msg);
      },
    });
  }

  /** Resetea formulario */
  resetCreateForm(): void {
    const today = this.getTodayDateIso();
    this.createForm.reset({
      name: '',
      productType: 'inversion',
      compoundingFrequency: 'monthly',
      initialAmount: 0,
      annualRate: 0,
      startDate: today,
      targetDate: this.buildTargetDateByFrequency(today, 'monthly'),
      notes: '',
    });
    this.initialAmountDisplay.set('0');
  }

  /** Etiqueta legible del estado */
  statusLabel(status: InvestmentStatus): string {
    return status === 'active' ? 'Activa' : 'Cerrada';
  }

  /** Etiqueta legible de capitalización */
  frequencyLabel(freq: InvestmentCompoundingFrequency): string {
    if (freq === 'monthly') return 'Mensual';
    if (freq === 'quarterly') return 'Trimestral';
    return 'Anual';
  }

  /** Clase visual del badge de estado */
  statusClass(status: InvestmentStatus): string {
    return status === 'active' ? 'badge--active' : 'badge--closed';
  }

  /** Formatea moneda COP */
  formatCurrency(value: number): string {
    const safeValue = Number.isFinite(value) ? value : 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(safeValue);
  }

  /** Formatea fecha YYYY-MM-DD */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  /** Cantidad para el chip de filtro por estado */
  getStatusCount(status: InvestmentStatus | undefined): number {
    if (!status) return this.investments().length;
    return this.investments().filter(item => item.status === status).length;
  }

  /** Cantidad para el chip de filtro por tipo */
  getTypeCount(type: InvestmentProductType | undefined): number {
    if (!type) return this.investments().length;
    return this.investments().filter(item => item.productType === type).length;
  }

  /** Muestra filtro de estado cuando tiene datos o es la opción global */
  shouldShowStatusFilter(status: InvestmentStatus | undefined): boolean {
    if (!status) return true;
    return this.getStatusCount(status) > 0;
  }

  /** Muestra filtro de tipo cuando tiene datos o es la opción global */
  shouldShowTypeFilter(type: InvestmentProductType | undefined): boolean {
    if (!type) return true;
    return this.getTypeCount(type) > 0;
  }

  /** Formatea y sincroniza el monto inicial mientras el usuario escribe */
  onInitialAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = (input.value || '').replace(/\D/g, '');

    if (!digitsOnly) {
      this.initialAmountDisplay.set('');
      this.createForm.controls.initialAmount.setValue(0);
      return;
    }

    const numericValue = Number(digitsOnly);
    this.createForm.controls.initialAmount.setValue(Number.isFinite(numericValue) ? numericValue : 0);
    this.initialAmountDisplay.set(this.formatIntegerForInput(numericValue));
  }

  /** Normaliza visualmente el monto al salir del input */
  onInitialAmountBlur(): void {
    const currentValue = this.createForm.getRawValue().initialAmount;
    this.initialAmountDisplay.set(this.formatIntegerForInput(currentValue));
  }

  /** Inicializa fechas por defecto al abrir módulo */
  private initializeDateDefaults(): void {
    const today = this.getTodayDateIso();
    const currentFrequency = this.createForm.getRawValue().compoundingFrequency;

    this.createForm.patchValue({
      startDate: today,
      targetDate: this.buildTargetDateByFrequency(today, currentFrequency),
    });

    this.createForm.controls.compoundingFrequency.valueChanges.subscribe((frequency) => {
      if (!frequency) return;
      const startDate = this.createForm.getRawValue().startDate || this.getTodayDateIso();

      this.createForm.patchValue({
        targetDate: this.buildTargetDateByFrequency(startDate, frequency),
      });
    });
  }

  /** Fecha local actual en formato YYYY-MM-DD */
  private getTodayDateIso(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  /** Calcula fecha meta según capitalización */
  private buildTargetDateByFrequency(
    fromDate: string,
    frequency: InvestmentCompoundingFrequency,
  ): string {
    const base = new Date(fromDate);
    if (Number.isNaN(base.getTime())) {
      return this.getTodayDateIso();
    }

    if (frequency === 'monthly') {
      base.setMonth(base.getMonth() + 1);
    } else if (frequency === 'quarterly') {
      base.setMonth(base.getMonth() + 3);
    } else {
      base.setFullYear(base.getFullYear() + 1);
    }

    const local = new Date(base.getTime() - base.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  /** Formato entero con separador de miles (es-CO) para inputs monetarios */
  private formatIntegerForInput(value: number): string {
    const safe = Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(safe);
  }
}
