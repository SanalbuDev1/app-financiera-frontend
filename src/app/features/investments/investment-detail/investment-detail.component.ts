import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvestmentStateService } from '../../../core/investments/application/services/investment-state.service';
import { GetInvestmentUseCase } from '../../../core/investments/application/use-cases/get-investment.use-case';
import { UpdateInvestmentUseCase } from '../../../core/investments/application/use-cases/update-investment.use-case';
import { DeleteInvestmentUseCase } from '../../../core/investments/application/use-cases/delete-investment.use-case';
import { ListInvestmentContributionsUseCase } from '../../../core/investments/application/use-cases/list-investment-contributions.use-case';
import { RegisterInvestmentContributionUseCase } from '../../../core/investments/application/use-cases/register-investment-contribution.use-case';
import { GetInvestmentProjectionUseCase } from '../../../core/investments/application/use-cases/get-investment-projection.use-case';
import {
  InvestmentCompoundingFrequency,
  InvestmentContributionType,
  InvestmentStatus,
  RegisterInvestmentContributionRequest,
  UpdateInvestmentRequest,
} from '../../../core/investments/domain/models/investment.model';

/**
 * Pantalla de detalle de inversión.
 * Permite ver rendimiento esperado, registrar aportes y editar datos clave.
 */
@Component({
  selector: 'app-investment-detail',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './investment-detail.component.html',
  styleUrl: './investment-detail.component.scss',
})
export class InvestmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly state = inject(InvestmentStateService);
  private readonly getUseCase = inject(GetInvestmentUseCase);
  private readonly updateUseCase = inject(UpdateInvestmentUseCase);
  private readonly deleteUseCase = inject(DeleteInvestmentUseCase);
  private readonly listContribUseCase = inject(ListInvestmentContributionsUseCase);
  private readonly registerContribUseCase = inject(RegisterInvestmentContributionUseCase);
  private readonly projectionUseCase = inject(GetInvestmentProjectionUseCase);

  /** Estado */
  readonly investment = this.state.selectedInvestment;
  readonly contributions = this.state.contributions;
  readonly projection = this.state.projection;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  /** UI state */
  readonly saving = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly isEditMode = signal(false);
  readonly isDeleteConfirm = signal(false);

  /** ID desde ruta */
  private investmentId = '';

  /** Opciones de formulario */
  readonly statusOptions: InvestmentStatus[] = ['active', 'closed'];
  readonly compoundingOptions: InvestmentCompoundingFrequency[] = ['monthly', 'quarterly', 'yearly'];
  readonly contributionTypeOptions: InvestmentContributionType[] = ['regular', 'extra'];

  /** Form de edición */
  readonly editForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    compoundingFrequency: 'monthly' as InvestmentCompoundingFrequency,
    annualRate: [0, [Validators.required, Validators.min(0)]],
    targetDate: ['', [Validators.required]],
    status: 'active' as InvestmentStatus,
    notes: '',
  });

  /** Form de aporte */
  readonly contributionForm = this.fb.nonNullable.group({
    contributionDate: ['', [Validators.required]],
    amount: [0, [Validators.required, Validators.min(1)]],
    contributionType: 'regular' as InvestmentContributionType,
    notes: '',
  });

  /** Ganancia porcentual estimada basada en projection */
  readonly projectedReturnPercent = computed(() => {
    const projection = this.projectionView();
    const inv = this.investment();
    if (!inv || inv.initialAmount <= 0) return 0;
    const pct = (projection.projectedGain / inv.initialAmount) * 100;
    return Number.isFinite(pct) ? pct : 0;
  });

  /**
   * Proyección final mostrada en UI.
   * Si backend no envía campos esperados, aplica estimación local de respaldo.
   */
  readonly projectionView = computed(() => {
    const inv = this.investment();
    const proj = this.projection();

    if (!inv) {
      return {
        projectedAmount: 0,
        projectedGain: 0,
        monthsToTarget: 0,
        annualRate: 0,
      };
    }

    const hasProjection = !!proj && (
      (proj.projectedAmount ?? 0) > 0 ||
      (proj.projectedGain ?? 0) > 0 ||
      (proj.monthsToTarget ?? 0) > 0
    );

    if (hasProjection && proj) {
      return {
        projectedAmount: proj.projectedAmount,
        projectedGain: proj.projectedGain,
        monthsToTarget: proj.monthsToTarget,
        annualRate: proj.annualRate,
      };
    }

    return this.estimateProjection(inv.currentAmount, inv.annualRate, inv.targetDate);
  });

  ngOnInit(): void {
    this.investmentId = this.route.snapshot.paramMap.get('id') ?? '';
    console.log('[InvestmentDetailComponent] ngOnInit()', this.investmentId);
    if (!this.investmentId) {
      this.router.navigate(['/investments']);
      return;
    }

    this.loadDetail();
  }

  /** Carga detalle, aportes y proyección */
  loadDetail(): void {
    this.getUseCase.execute(this.investmentId).subscribe({
      next: (investment) => {
        this.patchEditForm(investment);
        this.listContribUseCase.execute(this.investmentId);
        this.projectionUseCase.execute(this.investmentId);
      },
      error: (err) => {
        console.warn('[InvestmentDetailComponent] loadDetail() ← error', err);
      },
    });
  }

  /** Vuelve al listado */
  goBack(): void {
    this.router.navigate(['/investments']);
  }

  /** Abre edición */
  openEdit(): void {
    const investment = this.investment();
    if (!investment) return;
    this.patchEditForm(investment);
    this.actionError.set(null);
    this.isEditMode.set(true);
  }

  /** Guarda edición */
  onEditSubmit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const payload: UpdateInvestmentRequest = {
      name: this.editForm.getRawValue().name,
      compoundingFrequency: this.editForm.getRawValue().compoundingFrequency,
      annualRate: this.editForm.getRawValue().annualRate,
      targetDate: this.editForm.getRawValue().targetDate,
      status: this.editForm.getRawValue().status,
      notes: this.editForm.getRawValue().notes || undefined,
    };

    this.saving.set(true);
    this.actionError.set(null);

    this.updateUseCase.execute(this.investmentId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.isEditMode.set(false);
        this.loadDetail();
      },
      error: (err) => {
        console.warn('[InvestmentDetailComponent] onEditSubmit() ← error', err);
        this.saving.set(false);
        const e = err as { status?: number; error?: { message?: string } };
        this.actionError.set(
          e?.status === 400 ? (e?.error?.message ?? 'Datos inválidos') : 'Error al actualizar inversión'
        );
      },
    });
  }

  /** Registra aporte */
  onContributionSubmit(): void {
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

    this.saving.set(true);
    this.actionError.set(null);

    this.registerContribUseCase.execute(this.investmentId, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.contributionForm.reset({
          contributionDate: '',
          amount: 0,
          contributionType: 'regular',
          notes: '',
        });
        this.loadDetail();
      },
      error: (err) => {
        console.warn('[InvestmentDetailComponent] onContributionSubmit() ← error', err);
        this.saving.set(false);
        this.actionError.set('No fue posible registrar el aporte');
      },
    });
  }

  /** Confirma eliminar inversión */
  onDeleteConfirm(): void {
    this.saving.set(true);
    this.actionError.set(null);

    this.deleteUseCase.execute(this.investmentId).subscribe({
      next: () => {
        this.router.navigate(['/investments']);
      },
      error: (err) => {
        console.warn('[InvestmentDetailComponent] onDeleteConfirm() ← error', err);
        this.saving.set(false);
        this.isDeleteConfirm.set(false);
        this.actionError.set('No fue posible eliminar la inversión');
      },
    });
  }

  /** Etiqueta legible de estado */
  statusLabel(status: InvestmentStatus): string {
    return status === 'active' ? 'Activa' : 'Cerrada';
  }

  /** Etiqueta legible de frecuencia */
  frequencyLabel(freq: InvestmentCompoundingFrequency): string {
    if (freq === 'monthly') return 'Mensual';
    if (freq === 'quarterly') return 'Trimestral';
    return 'Anual';
  }

  /** Clase visual para estado */
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

  /** Prellena formulario de edición */
  private patchEditForm(investment: NonNullable<ReturnType<typeof this.investment>>): void {
    this.editForm.patchValue({
      name: investment.name,
      compoundingFrequency: investment.compoundingFrequency,
      annualRate: investment.annualRate,
      targetDate: investment.targetDate,
      status: investment.status,
      notes: investment.notes ?? '',
    });
  }

  /** Estimación local con capitalización mensual para evitar proyección en cero */
  private estimateProjection(currentAmount: number, annualRate: number, targetDate: string): {
    projectedAmount: number;
    projectedGain: number;
    monthsToTarget: number;
    annualRate: number;
  } {
    const now = new Date();
    const target = new Date(targetDate);
    const months = Math.max(
      0,
      (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
    );

    const monthlyRate = Math.max(0, annualRate) / 100 / 12;
    const projectedAmount = monthlyRate > 0
      ? currentAmount * Math.pow(1 + monthlyRate, months)
      : currentAmount;

    const projectedGain = Math.max(0, projectedAmount - currentAmount);

    return {
      projectedAmount,
      projectedGain,
      monthsToTarget: months,
      annualRate,
    };
  }
}
