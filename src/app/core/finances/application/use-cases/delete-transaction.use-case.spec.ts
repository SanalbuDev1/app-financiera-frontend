import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DeleteTransactionUseCase } from './delete-transaction.use-case';
import { TransactionStateService } from '../services/transaction-state.service';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { Transaction } from '../../domain/models/transaction.model';

const mockTx: Transaction = {
  id: 'tx1', description: 'Gasto', amount: 100, category: 'food', type: 'expense', date: new Date(),
};

describe('DeleteTransactionUseCase', () => {
  let useCase: DeleteTransactionUseCase;
  let port: any;
  let state: TransactionStateService;

  beforeEach(() => {
    const portSpy = {
      getAll: vi.fn(), getAllNoPagination: vi.fn(), getSummary: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DeleteTransactionUseCase,
        { provide: TRANSACTION_PORT, useValue: portSpy },
        TransactionStateService,
      ],
    });

    useCase = TestBed.inject(DeleteTransactionUseCase);
    port = TestBed.inject(TRANSACTION_PORT);
    state = TestBed.inject(TransactionStateService);
  });

  it('should call port.delete with the id', () => {
    port.delete.mockReturnValue(of(undefined));
    state.setPaginatedTransactions({
      content: [mockTx], totalElements: 1, totalPages: 1, page: 1, size: 15,
    });

    useCase.execute('tx1');

    expect(port.delete).toHaveBeenCalledWith('tx1');
  });

  it('should optimistically remove the transaction from state', () => {
    port.delete.mockReturnValue(of(undefined));
    state.setPaginatedTransactions({
      content: [mockTx], totalElements: 1, totalPages: 1, page: 1, size: 15,
    });

    useCase.execute('tx1');

    expect(state.transactions()).toEqual([]);
    expect(state.totalElements()).toBe(0);
  });

  it('should invoke onSuccess callback on success', () => {
    port.delete.mockReturnValue(of(undefined));
    state.setPaginatedTransactions({
      content: [mockTx], totalElements: 1, totalPages: 1, page: 1, size: 15,
    });
    const onSuccess = vi.fn();

    useCase.execute('tx1', onSuccess);

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should set error on failure but still remove optimistically', () => {
    port.delete.mockReturnValue(throwError(() => new Error('Delete failed')));
    state.setPaginatedTransactions({
      content: [mockTx], totalElements: 1, totalPages: 1, page: 1, size: 15,
    });

    useCase.execute('tx1');

    expect(state.error()).toBe('Delete failed');
    // Optimistic removal already happened
    expect(state.transactions()).toEqual([]);
  });
});
