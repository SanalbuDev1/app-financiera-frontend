import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DebtStateService } from '../../../core/debts/application/services/debt-state.service';
import { GetDebtDetailUseCase } from '../../../core/debts/application/use-cases/get-debt-detail.use-case';
import { UpdateDebtUseCase } from '../../../core/debts/application/use-cases/update-debt.use-case';
import { DeleteDebtUseCase } from '../../../core/debts/application/use-cases/delete-debt.use-case';
import { RegisterPaymentUseCase } from '../../../core/debts/application/use-cases/register-payment.use-case';
import { DebtScheduleItem, getDebtTypeIcon } from '../../../core/debts/domain/models/debt.model';
import { RegisterPaymentModalComponent } from '../register-payment-modal/register-payment-modal.component';

/**
 * Componente de detalle de una deuda.
 * Muestra información completa, cronograma de amortización y acciones (pagar, editar, eliminar).
 */
@Component({
  selector: 'app-debt-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RegisterPaymentModalComponent],
  templateUrl: './debt-detail.component.html',
  styleUrl: './debt-detail.component.scss',
})
export class DebtDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly state = inject(DebtStateService);
  private readonly getDetailUseCase = inject(GetDebtDetailUseCase);
  private readonly updateDebtUseCase = inject(UpdateDebtUseCase);
  private readonly deleteDebtUseCase = inject(DeleteDebtUseCase);
  private readonly registerPaymentUseCase = inject(RegisterPaymentUseCase);

  /** Estado global (signals) */
  readonly detail = this.state.currentDetail;
  readonly loading = this.state.loading;
  readonly error = this.state.error;

  /** ID de la deuda activa (de la URL) */
  private debtId = '';

  /** Modal de pago */
  readonly isPaymentModalOpen = signal(false);

  /** Modal de edición inline */
  readonly isEditMode = signal(false);

  /** Confirmación de eliminación inline */
  readonly isDeleteConfirm = signal(false);

  /** Error de la operación actual (editar/eliminar) */
  readonly actionError = signal<string | null>(null);

  /** Indica si se está guardando una acción */
  readonly saving = signal(false);

  /** Utilidad: ícono por tipo de deuda */
  readonly getDebtTypeIcon = getDebtTypeIcon;

  /** Formulario de edición (solo creditor, description, notes) */
  readonly editForm = this.fb.group({
    creditor:    ['', [Validators.required, Validators.minLength(2)]],
    description: ['', [Validators.required, Validators.minLength(2)]],
    notes:       [''],
  });

  /** Próxima cuota pendiente del cronograma */
  readonly nextPendingInstallment = computed((): DebtScheduleItem | null => {
    const schedule = this.detail()?.schedule ?? [];
    const pending = schedule
      .filter(s => s.status === 'pending' || s.status === 'overdue')
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
    return pending[0] ?? null;
  });

  ngOnInit(): void {
    this.debtId = this.route.snapshot.paramMap.get('id') ?? '';
    console.log('[DebtDetailComponent] ngOnInit()', this.debtId);
    if (this.debtId) {
      this.loadDetail();
    } else {
      this.router.navigate(['/debts']);
    }
  }

  /**
   * Carga el detalle completo de la deuda.
   */
  loadDetail(): void {
    this.getDetailUseCase.execute(this.debtId);
  }

  /**
   * Abre el formulario de edición y pre-llena con los datos actuales.
   */
  openEditMode(): void {
    const debt = this.detail()?.debt;
    if (!debt) return;
    this.editForm.patchValue({
      creditor:    debt.creditor,
      description: debt.description,
      notes:       debt.notes ?? '',
    });
    this.actionError.set(null);
    this.isEditMode.set(true);
  }

  /**
   * Envía el formulario de edición.
   */
  onEditSubmit(): void {
    console.log('[DebtDetailComponent] onEditSubmit()');
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    const { creditor, description, notes } = this.editForm.value;
    this.saving.set(true);
    this.actionError.set(null);

    this.updateDebtUseCase.execute(this.debtId, {
      creditor:    creditor!,
      description: description!,
      notes:       notes ?? undefined,
    }).subscribe({
      next: () => {
        console.log('[DebtDetailComponent] onEditSubmit() ← éxito');
        this.isEditMode.set(false);
        this.saving.set(false);
        this.loadDetail();
      },
      error: (err) => {
        console.warn('[DebtDetailComponent] onEditSubmit() ← error', err);
        const e = err as { status?: number; error?: { message?: string } };
        this.actionError.set(
          e?.status === 400 ? (e?.error?.message ?? 'Datos inválidos') :
          'Error inesperado, intenta de nuevo',
        );
        this.saving.set(false);
      },
    });
  }

  /**
   * Confirma la eliminación de la deuda.
   */
  onDeleteConfirm(): void {
    console.log('[DebtDetailComponent] onDeleteConfirm()');
    this.saving.set(true);
    this.actionError.set(null);

    this.deleteDebtUseCase.execute(this.debtId).subscribe({
      next: () => {
        console.log('[DebtDetailComponent] onDeleteConfirm() ← éxito');
        this.router.navigate(['/debts']);
      },
      error: (err) => {
        console.warn('[DebtDetailComponent] onDeleteConfirm() ← error', err);
        const e = err as { status?: number; error?: { message?: string } };
        this.actionError.set(
          e?.status === 404 ? 'Deuda no encontrada' : 'Error inesperado, intenta de nuevo',
        );
        this.saving.set(false);
        this.isDeleteConfirm.set(false);
      },
    });
  }

  /**
   * Maneja el guardado exitoso de un pago: cierra modal y recarga detalle.
   */
  onPaymentSaved(): void {
    console.log('[DebtDetailComponent] onPaymentSaved()');
    this.isPaymentModalOpen.set(false);
    this.loadDetail();
  }

  /**
   * Navega de regreso a la lista de deudas.
   */
  goBack(): void {
    this.router.navigate(['/debts']);
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
   * Retorna la clase CSS según el estado del ítem de cronograma.
   */
  scheduleStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'badge--pending',
      paid:    'badge--paid',
      partial: 'badge--partial',
      overdue: 'badge--overdue',
    };
    return map[status] ?? '';
  }

  /**
   * Retorna el texto legible del estado del ítem de cronograma.
   */
  scheduleStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      paid:    'Pagada',
      partial: 'Parcial',
      overdue: 'Vencida',
    };
    return map[status] ?? status;
  }

  /**
   * Retorna la clase CSS del badge de estado de la deuda.
   */
  debtStatusClass(status: string): string {
    const map: Record<string, string> = {
      active:   'badge--active',
      paid_off: 'badge--paid',
      defaulted: 'badge--defaulted',
    };
    return map[status] ?? '';
  }

  /**
   * Retorna el texto legible del estado de la deuda.
   */
  debtStatusLabel(status: string): string {
    const map: Record<string, string> = {
      active:    'Activa',
      paid_off:  'Saldada',
      defaulted: 'En mora',
    };
    return map[status] ?? status;
  }
}
