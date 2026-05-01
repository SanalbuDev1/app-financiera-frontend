import { TestBed } from '@angular/core/testing';
import { ExpenseModalComponent } from './expense-modal.component';
import { Transaction } from '../../../core/finances/domain/models/transaction.model';
import { CreateTransactionDto } from '../../../core/finances/domain/ports/transaction.port';

const mockTransaction: Transaction = {
  id: 'tx2',
  description: 'Supermercado',
  amount: 150,
  category: 'food',
  type: 'expense',
  date: new Date('2026-05-02T00:00:00'),
  notes: 'Compra semanal',
};

describe('ExpenseModalComponent', () => {
  let component: ExpenseModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpenseModalComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ExpenseModalComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('creation mode', () => {
    beforeEach(() => {
      component.transaction = null;
      component.ngOnInit();
    });

    it('should not be in edit mode', () => {
      expect(component.isEditMode).toBe(false);
    });

    it('should have default category as other', () => {
      expect(component.form.get('category')?.value).toBe('other');
    });

    it('should not submit with empty form', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit DTO when form is valid', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.form.setValue({
        description: 'Taxi', amount: 25, date: '2026-05-10', category: 'transport', notes: '',
      });

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith({
        description: 'Taxi',
        amount: 25,
        category: 'transport',
        type: 'expense',
        transactionDate: '2026-05-10',
        notes: undefined,
      } as CreateTransactionDto);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => {
      component.transaction = mockTransaction;
      component.ngOnInit();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBe(true);
    });

    it('should populate form with transaction data', () => {
      expect(component.form.get('description')?.value).toBe('Supermercado');
      expect(component.form.get('amount')?.value).toBe(150);
      expect(component.form.get('category')?.value).toBe('food');
      expect(component.form.get('notes')?.value).toBe('Compra semanal');
    });

    it('should emit updated DTO on submit', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.form.patchValue({ amount: 200, description: 'Mercado' });

      component.onSubmit();

      const emitted = emitSpy.mock.calls[0][0] as CreateTransactionDto;
      expect(emitted.amount).toBe(200);
      expect(emitted.description).toBe('Mercado');
      expect(emitted.type).toBe('expense');
    });
  });

  describe('close', () => {
    it('should emit closed event', () => {
      const emitSpy = vi.spyOn(component.closed, 'emit');
      component.onClose();
      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should require description with min length 2', () => {
      component.form.patchValue({ description: 'X' });
      expect(component.form.get('description')?.hasError('minlength')).toBe(true);
    });

    it('should require amount > 0', () => {
      component.form.patchValue({ amount: 0 });
      expect(component.form.get('amount')?.hasError('min')).toBe(true);
    });

    it('should require date', () => {
      component.form.patchValue({ date: '' });
      expect(component.form.get('date')?.hasError('required')).toBe(true);
    });

    it('should have 8 expense categories', () => {
      expect(component.categories).toHaveLength(8);
    });
  });
});
