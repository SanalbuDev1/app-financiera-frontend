import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterPaymentUseCase } from '../../../core/debts/application/use-cases/register-payment.use-case';
import {
  DebtScheduleItem,
  RegisterPaymentRequest,
  PaymentType,
  ExtraPaymentStrategy,
} from '../../../core/debts/domain/models/debt.model';

/**
 * Modal para registrar un pago (regular o extraordinario) en una deuda.
 * Si es regular, muestra la próxima cuota pendiente como referencia.
 * Si es extraordinario, permite ingresar el monto y elegir estrategia.
 */
@Component({
  selector: 'app-register-payment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-payment-modal.component.html',
  styleUrl: './register-payment-modal.component.scss',
})
export class RegisterPaymentModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly registerPaymentUseCase = inject(RegisterPaymentUseCase);

  /** ID de la deuda a la que se registra el pago */
  @Input({ required: true }) debtId!: string;

  /** Próxima cuota pendiente del cronograma (null si no hay) */
  @Input() nextInstallment: DebtScheduleItem | null = null;

  /** Emite al guardar exitosamente */
  @Output() saved = new EventEmitter<void>();

  /** Emite al cancelar o cerrar el modal */
  @Output() closed = new EventEmitter<void>();

  /** Error del servidor */
  readonly serverError = signal<string | null>(null);

  /** Indica si se está guardando */
  readonly saving = signal(false);

  /** Formulario reactivo del pago */
  readonly form = this.fb.group({
    paymentType:            ['regular' as PaymentType, Validators.required],
    paymentDate:            [new Date().toISOString().substring(0, 10), Validators.required],
    totalAmount:            [null as number | null],
    extraPaymentStrategy:   [null as ExtraPaymentStrategy | null],
    notes:                  [''],
  });

  /** Tipo de pago activo */
  get paymentType(): PaymentType {
    return this.form.get('paymentType')!.value as PaymentType;
  }

  /** True si el pago es extraordinario */
  get isExtra(): boolean {
    return this.paymentType === 'extra';
  }

  ngOnInit(): void {
    console.log('[RegisterPaymentModalComponent] ngOnInit()', this.debtId);
    // Al cambiar el tipo de pago, actualizar validadores
    this.form.get('paymentType')!.valueChanges.subscribe(type => {
      const amountCtrl = this.form.get('totalAmount')!;
      const strategyCtrl = this.form.get('extraPaymentStrategy')!;
      if (type === 'extra') {
        amountCtrl.setValidators([Validators.required, Validators.min(1)]);
        strategyCtrl.setValidators([Validators.required]);
      } else {
        amountCtrl.clearValidators();
        strategyCtrl.clearValidators();
      }
      amountCtrl.updateValueAndValidity();
      strategyCtrl.updateValueAndValidity();
    });
  }

  /**
   * Formatea un número como moneda.
   */
  formatAmount(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  /**
   * Formatea una fecha 'YYYY-MM-DD' a formato legible.
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  }

  /**
   * Envía el formulario si es válido.
   */
  onSubmit(): void {
    console.log('[RegisterPaymentModalComponent] onSubmit()');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const isExtra = v.paymentType === 'extra';

    // Para regular: enviamos el monto de la próxima cuota (requerido por @NotNull del backend)
    const totalAmount = isExtra
      ? v.totalAmount!
      : (this.nextInstallment?.totalAmount ?? 0);

    const req: RegisterPaymentRequest = {
      paymentType:  v.paymentType as PaymentType,
      paymentDate:  v.paymentDate || undefined,
      totalAmount,
      notes:        v.notes || undefined,
    };

    if (isExtra && v.extraPaymentStrategy) {
      req.extraPaymentStrategy = v.extraPaymentStrategy as ExtraPaymentStrategy;
    }

    console.log('[RegisterPaymentModalComponent] onSubmit() — enviando pago', req.paymentType);
    this.saving.set(true);
    this.serverError.set(null);

    this.registerPaymentUseCase.execute(this.debtId, req).subscribe({
      next: () => {
        console.log('[RegisterPaymentModalComponent] onSubmit() ← éxito');
        this.saving.set(false);
        this.saved.emit();
      },
      error: (err) => {
        console.warn('[RegisterPaymentModalComponent] onSubmit() ← error', err);
        this.saving.set(false);
        const e = err as { status?: number; error?: { message?: string } };
        this.serverError.set(
          e?.status === 422 ? 'Esta deuda no tiene cuotas pendientes' :
          e?.status === 400 ? (e?.error?.message ?? 'Datos inválidos') :
          e?.status === 404 ? 'Deuda no encontrada' :
          'Error inesperado, intenta de nuevo',
        );
      },
    });
  }

  /**
   * Cierra el modal sin guardar.
   */
  onClose(): void {
    console.log('[RegisterPaymentModalComponent] onClose()');
    this.closed.emit();
  }
}
