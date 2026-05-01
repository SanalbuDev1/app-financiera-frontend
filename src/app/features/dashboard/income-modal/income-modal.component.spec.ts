import { TestBed } from '@angular/core/testing';
import { IncomeModalComponent } from './income-modal.component';
import { Transaction } from '../../../core/finances/domain/models/transaction.model';
import { CreateTransactionDto } from '../../../core/finances/domain/ports/transaction.port';

const mockTransaction: Transaction = {
  id: 'tx1',
  description: 'Salario Abril',
  amount: 3000,
  category: 'salary',
  type: 'income',
  date: new Date('2026-04-30T00:00:00'),
  notes: 'Pago mensual',
};

describe('IncomeModalComponent', () => {
  let component: IncomeModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IncomeModalComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(IncomeModalComponent);
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

    it('should have default category as salary', () => {
      expect(component.form.get('category')?.value).toBe('salary');
    });

    it('should have today as default date', () => {
      const today = new Date().toISOString().substring(0, 10);
      expect(component.form.get('date')?.value).toBe(today);
    });

    it('should not submit with empty form', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.onSubmit();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit DTO when form is valid', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.form.setValue({
        description: 'Freelance', amount: 500, date: '2026-05-01', category: 'freelance', notes: '',
      });

      component.onSubmit();

      expect(emitSpy).toHaveBeenCalledWith({
        description: 'Freelance',
        amount: 500,
        category: 'freelance',
        type: 'income',
        transactionDate: '2026-05-01',
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
      expect(component.form.get('description')?.value).toBe('Salario Abril');
      expect(component.form.get('amount')?.value).toBe(3000);
      expect(component.form.get('category')?.value).toBe('salary');
      expect(component.form.get('notes')?.value).toBe('Pago mensual');
    });

    it('should emit updated DTO on submit', () => {
      const emitSpy = vi.spyOn(component.saved, 'emit');
      component.form.patchValue({ amount: 3500 });

      component.onSubmit();

      const emitted = emitSpy.mock.calls[0][0] as CreateTransactionDto;
      expect(emitted.amount).toBe(3500);
      expect(emitted.type).toBe('income');
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
  });
});
