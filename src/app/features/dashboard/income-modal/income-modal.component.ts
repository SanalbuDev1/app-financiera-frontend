import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Transaction, TransactionCategory } from '../../../core/finances/domain/models/transaction.model';
import { CreateTransactionDto } from '../../../core/finances/domain/ports/transaction.port';

/**
 * Modal para registrar o editar un ingreso.
 * Si recibe [transaction], entra en modo edición y pre-llena el formulario.
 * Emite el ingreso creado/editado al componente padre al guardar,
 * o emite close al cancelar.
 */
@Component({
  selector: 'app-income-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './income-modal.component.html',
  styleUrl: './income-modal.component.scss',
})
export class IncomeModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  /** Transacción a editar (null = modo creación) */
  @Input() transaction: Transaction | null = null;

  /** Emite el DTO de la transacción creada/editada al confirmar */
  @Output() saved = new EventEmitter<CreateTransactionDto>();

  /** Emite al cancelar o cerrar el modal */
  @Output() closed = new EventEmitter<void>();

  /** Indica si el modal está en modo edición */
  get isEditMode(): boolean {
    return this.transaction !== null;
  }

  /** Categorías disponibles para ingresos */
  readonly categories: { value: TransactionCategory; label: string; icon: string }[] = [
    { value: 'salary',     label: 'Salario',    icon: '💰' },
    { value: 'freelance',  label: 'Freelance',  icon: '💻' },
    { value: 'investment', label: 'Inversión',  icon: '📈' },
    { value: 'savings',    label: 'Ahorros',    icon: '🏦' },
    { value: 'other',      label: 'Otro',       icon: '📦' },
  ];

  /** Formulario reactivo del ingreso */
  readonly form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(2)]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    date:        [new Date().toISOString().substring(0, 10), Validators.required],
    category:    ['salary' as TransactionCategory, Validators.required],
    notes:       [''],
  });

  ngOnInit(): void {
    if (this.transaction) {
      console.log('[IncomeModalComponent] ngOnInit() — modo edición', this.transaction.id);
      const tx = this.transaction;
      this.form.patchValue({
        description: tx.description,
        amount: tx.amount,
        date: tx.date instanceof Date
          ? tx.date.toISOString().substring(0, 10)
          : String(tx.date).substring(0, 10),
        category: tx.category,
        notes: tx.notes ?? '',
      });
    }
  }

  /**
   * Envía el formulario si es válido y emite la transacción.
   */
  onSubmit(): void {
    console.log('[IncomeModalComponent] onSubmit()');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[IncomeModalComponent] onSubmit() — formulario inválido');
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateTransactionDto = {
      description:     v.description!,
      amount:          v.amount!,
      category:        v.category!,
      type:            'income',
      transactionDate: v.date!,
      notes:           v.notes || undefined,
    };
    console.log('[IncomeModalComponent] onSubmit() ← DTO creado', dto);
    this.saved.emit(dto);
  }

  /**
   * Cierra el modal sin guardar.
   */
  onClose(): void {
    console.log('[IncomeModalComponent] onClose()');
    this.closed.emit();
  }
}