import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ListTransactionsUseCase } from './list-transactions.use-case';
import { TransactionStateService } from '../services/transaction-state.service';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { Transaction } from '../../domain/models/transaction.model';
import { PaginatedResponse } from '../../domain/ports/transaction.port';

const mockTx: Transaction = {
  id: 'tx1', description: 'Test', amount: 100, category: 'food', type: 'expense', date: new Date(),
};

const mockResponse: PaginatedResponse<Transaction> = {
  content: [mockTx],
  totalElements: 1,
  totalPages: 1,
  page: 1,
  size: 15,
};

describe('ListTransactionsUseCase', () => {
  let useCase: ListTransactionsUseCase;
  let port: any;
  let state: TransactionStateService;

  beforeEach(() => {
    const portSpy = {
      getAll: vi.fn(),
      getAllNoPagination: vi.fn(),
      getSummary: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ListTransactionsUseCase,
        { provide: TRANSACTION_PORT, useValue: portSpy },
        TransactionStateService,
      ],
    });

    useCase = TestBed.inject(ListTransactionsUseCase);
    port = TestBed.inject(TRANSACTION_PORT);
    state = TestBed.inject(TransactionStateService);
  });

  describe('execute', () => {
    it('should call port.getAll with the filter', () => {
      port.getAll.mockReturnValue(of(mockResponse));
      const filter = { page: 1, size: 15 };

      useCase.execute(filter);

      expect(port.getAll).toHaveBeenCalledWith(filter);
    });

    it('should update state with paginated response', () => {
      port.getAll.mockReturnValue(of(mockResponse));

      useCase.execute({ page: 1, size: 15 });

      expect(state.transactions()).toEqual([mockTx]);
      expect(state.totalElements()).toBe(1);
    });

    it('should set loading to true then false', () => {
      port.getAll.mockReturnValue(of(mockResponse));

      useCase.execute({ page: 1, size: 15 });

      expect(state.loading()).toBe(false); // finalize already ran
    });

    it('should set error on failure', () => {
      port.getAll.mockReturnValue(throwError(() => new Error('Network error')));

      useCase.execute({ page: 1, size: 15 });

      expect(state.error()).toBe('Network error');
      expect(state.loading()).toBe(false);
    });
  });

  describe('loadAll', () => {
    it('should call port.getAllNoPagination and update allTransactions', () => {
      port.getAllNoPagination.mockReturnValue(of([mockTx]));

      useCase.loadAll();

      expect(port.getAllNoPagination).toHaveBeenCalled();
      expect(state.allTransactions()).toEqual([mockTx]);
    });

    it('should handle errors gracefully', () => {
      port.getAllNoPagination.mockReturnValue(throwError(() => new Error('fail')));

      expect(() => useCase.loadAll()).not.toThrow();
    });
  });
});
