import { Component, EventEmitter, Output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import {
  CreateDebtRequest,
  DEBT_TYPES,
  DEBT_FREQUENCIES,
  InterestRateType,
  calculateInstallment,
} from '../../../core/debts/domain/models/debt.model';

/**
 * Modal para crear una nueva deuda.
 * Incluye preview en tiempo real de la cuota calculada (fórmula francesa).
 * Emite el DTO de creación al guardar, o closed al cancelar.
 */
@Component({
  selector: 'app-create-debt-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-debt-modal.component.html',
  styleUrl: './create-debt-modal.component.scss',
})
export class CreateDebtModalComponent {
  private readonly fb = inject(FormBuilder);

  /** Tipos de deuda disponibles */
  readonly debtTypes = DEBT_TYPES;

  /** Frecuencias disponibles */
  readonly frequencies = DEBT_FREQUENCIES;

  /** Emite el DTO de creación al confirmar */
  @Output() saved = new EventEmitter<CreateDebtRequest>();

  /** Emite al cancelar o cerrar el modal */
  @Output() closed = new EventEmitter<void>();

  /** Formulario reactivo de creación de deuda */
  readonly form = this.fb.group({
    creditor:          ['', [Validators.required, Validators.minLength(2)]],
    description:       ['', [Validators.required, Validators.minLength(2)]],
    debtTypeId:        [DEBT_TYPES[0].id, Validators.required],
    frequencyId:       [DEBT_FREQUENCIES[0].id, Validators.required],
    originalAmount:    [null as number | null, [Validators.required, Validators.min(1)]],
    interestRate:      [null as number | null, [Validators.required, Validators.min(0), Validators.max(100)]],
    interestRateType:  ['monthly' as InterestRateType, Validators.required],
    totalInstallments: [null as number | null, [Validators.required, Validators.min(1), Validators.max(600)]],
    startDate:         [new Date().toISOString().substring(0, 10), Validators.required],
    notes:             [''],
  });

  /** Preview de la cuota mensual calculada en tiempo real */
  get installmentPreview(): number {
    const v = this.form.value;
    const P = v.originalAmount;
    const rate = v.interestRate;
    const rateType = v.interestRateType as InterestRateType;
    const n = v.totalInstallments;
    if (!P || !n || P <= 0 || n <= 0 || rate == null || rate < 0) return 0;
    return calculateInstallment(P, rate, rateType, n);
  }

  /** True si hay datos suficientes para mostrar el preview de la cuota */
  get showPreview(): boolean {
    const v = this.form.value;
    return !!(v.originalAmount && v.originalAmount > 0 &&
              v.totalInstallments && v.totalInstallments > 0 &&
              v.interestRate != null && v.interestRate >= 0);
  }

  /**
   * Devuelve el control tipado.
   */
  field(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  /**
   * Formatea la cuota preview como moneda.
   */
  formatPreview(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Envía el formulario si es válido.
   */
  onSubmit(): void {
    console.log('[CreateDebtModalComponent] onSubmit()');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[CreateDebtModalComponent] onSubmit() — formulario inválido');
      return;
    }
    const v = this.form.value;
    const req: CreateDebtRequest = {
      creditor:          v.creditor!,
      description:       v.description!,
      debtTypeId:        v.debtTypeId!,
      frequencyId:       v.frequencyId!,
      originalAmount:    v.originalAmount!,
      interestRate:      v.interestRate!,
      interestRateType:  v.interestRateType as InterestRateType,
      totalInstallments: v.totalInstallments!,
      startDate:         v.startDate!,
      notes:             v.notes || undefined,
    };
    console.log('[CreateDebtModalComponent] onSubmit() — emitiendo', req.creditor);
    this.saved.emit(req);
  }

  /**
   * Cierra el modal sin guardar.
   */
  onClose(): void {
    console.log('[CreateDebtModalComponent] onClose()');
    this.closed.emit();
  }
}
