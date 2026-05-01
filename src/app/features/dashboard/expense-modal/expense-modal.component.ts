import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Transaction, TransactionCategory } from '../../../core/finances/domain/models/transaction.model';
import { CreateTransactionDto } from '../../../core/finances/domain/ports/transaction.port';

/**
 * Modal para registrar o editar un gasto.
 * Si recibe [transaction], entra en modo edición y pre-llena el formulario.
 * Emite la transaccion creada/editada al componente padre al guardar,
 * o emite closed al cancelar.
 */
@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-modal.component.html',
  styleUrl: './expense-modal.component.scss',
})
export class ExpenseModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  /** Transacción a editar (null = modo creación) */
  @Input() transaction: Transaction | null = null;

  @Output() saved = new EventEmitter<CreateTransactionDto>();
  @Output() closed = new EventEmitter<void>();

  /** Indica si el modal está en modo edición */
  get isEditMode(): boolean {
    return this.transaction !== null;
  }

  readonly categories: { value: TransactionCategory; label: string; icon: string }[] = [
    { value: 'food',          label: 'Comida',         icon: '🍽️' },
    { value: 'transport',     label: 'Transporte',     icon: '🚌' },
    { value: 'bills',         label: 'Cuentas',        icon: '🧾' },
    { value: 'entertainment', label: 'Ocio',           icon: '🎬' },
    { value: 'health',        label: 'Salud',          icon: '🏥' },
    { value: 'education',     label: 'Educación',      icon: '📚' },
    { value: 'shopping',      label: 'Compras',        icon: '🛒' },
    { value: 'other',         label: 'Otro',           icon: '📦' },
  ];

  readonly form = this.fb.group({
    description: ['', [Validators.required, Validators.minLength(2)]],
    amount:      [null as number | null, [Validators.required, Validators.min(0.01)]],
    date:        [new Date().toISOString().substring(0, 10), Validators.required],
    category:    ['other' as TransactionCategory, Validators.required],
    notes:       [''],
  });

  ngOnInit(): void {
    if (this.transaction) {
      console.log('[ExpenseModalComponent] ngOnInit() — modo edición', this.transaction.id);
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

  onSubmit(): void {
    console.log('[ExpenseModalComponent] onSubmit()');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      console.warn('[ExpenseModalComponent] onSubmit() -- formulario invalido');
      return;
    }
    const v = this.form.getRawValue();
    const dto: CreateTransactionDto = {
      description:     v.description!,
      amount:          v.amount!,
      category:        v.category!,
      type:            'expense',
      transactionDate: v.date!,
      notes:           v.notes || undefined,
    };
    console.log('[ExpenseModalComponent] onSubmit() <- DTO creado', dto);
    this.saved.emit(dto);
  }

  onClose(): void {
    console.log('[ExpenseModalComponent] onClose()');
    this.closed.emit();
  }
}