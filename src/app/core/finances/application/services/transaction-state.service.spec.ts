import { TestBed } from '@angular/core/testing';
import { TransactionStateService } from './transaction-state.service';
import { Transaction } from '../../domain/models/transaction.model';
import { PaginatedResponse } from '../../domain/ports/transaction.port';
import { FinancialSummary } from '../../domain/models/summary.model';

const mockTx: Transaction = {
  id: 'tx1',
  description: 'Salario',
  amount: 3000,
  category: 'salary',
  type: 'income',
  date: new Date('2026-05-01T00:00:00'),
};

const mockTx2: Transaction = {
  id: 'tx2',
  description: 'Supermercado',
  amount: 150,
  category: 'food',
  type: 'expense',
  date: new Date('2026-05-02T00:00:00'),
};

describe('TransactionStateService', () => {
  let service: TransactionStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty state', () => {
    expect(service.transactions()).toEqual([]);
    expect(service.allTransactions()).toEqual([]);
    expect(service.totalElements()).toBe(0);
    expect(service.totalPages()).toBe(1);
    expect(service.currentPage()).toBe(1);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.hasData()).toBe(false);
  });

  describe('setPaginatedTransactions', () => {
    it('should update transactions and pagination signals', () => {
      const response: PaginatedResponse<Transaction> = {
        content: [mockTx, mockTx2],
        totalElements: 20,
        totalPages: 2,
        page: 1,
        size: 15,
      };

      service.setPaginatedTransactions(response);

      expect(service.transactions()).toEqual([mockTx, mockTx2]);
      expect(service.totalElements()).toBe(20);
      expect(service.totalPages()).toBe(2);
      expect(service.currentPage()).toBe(1);
      expect(service.hasData()).toBe(true);
    });
  });

  describe('setSummary', () => {
    it('should update the summary signal', () => {
      const summary: FinancialSummary = {
        totalBalance: 5000,
        monthlyIncome: 3000,
        monthlyExpenses: 1000,
        monthlySavings: 2000,
        savingsGoal: 3000,
      };

      service.setSummary(summary);

      expect(service.summary()).toEqual(summary);
    });
  });

  describe('setAllTransactions', () => {
    it('should store all transactions', () => {
      service.setAllTransactions([mockTx, mockTx2]);
      expect(service.allTransactions()).toHaveLength(2);
    });
  });

  describe('addTransaction', () => {
    it('should prepend the transaction and increment totalElements', () => {
      service.setPaginatedTransactions({
        content: [mockTx2], totalElements: 1, totalPages: 1, page: 1, size: 15,
      });

      service.addTransaction(mockTx);

      expect(service.transactions()[0]).toEqual(mockTx);
      expect(service.transactions()).toHaveLength(2);
      expect(service.totalElements()).toBe(2);
    });
  });

  describe('updateTransaction', () => {
    it('should replace the matching transaction', () => {
      service.setPaginatedTransactions({
        content: [mockTx, mockTx2], totalElements: 2, totalPages: 1, page: 1, size: 15,
      });

      const updated = { ...mockTx, description: 'Salario actualizado' };
      service.updateTransaction(updated);

      expect(service.transactions()[0].description).toBe('Salario actualizado');
      expect(service.transactions()).toHaveLength(2);
    });
  });

  describe('removeTransaction', () => {
    it('should remove the transaction and decrement totalElements', () => {
      service.setPaginatedTransactions({
        content: [mockTx, mockTx2], totalElements: 2, totalPages: 1, page: 1, size: 15,
      });

      service.removeTransaction('tx1');

      expect(service.transactions()).toHaveLength(1);
      expect(service.transactions()[0].id).toBe('tx2');
      expect(service.totalElements()).toBe(1);
    });

    it('should not go below 0 for totalElements', () => {
      service.removeTransaction('nonexistent');
      expect(service.totalElements()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should reset all state to defaults', () => {
      service.setPaginatedTransactions({
        content: [mockTx], totalElements: 10, totalPages: 2, page: 2, size: 15,
      });
      service.setAllTransactions([mockTx, mockTx2]);
      service.loading.set(true);
      service.error.set('Some error');

      service.clear();

      expect(service.transactions()).toEqual([]);
      expect(service.allTransactions()).toEqual([]);
      expect(service.totalElements()).toBe(0);
      expect(service.totalPages()).toBe(1);
      expect(service.currentPage()).toBe(1);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });
});
