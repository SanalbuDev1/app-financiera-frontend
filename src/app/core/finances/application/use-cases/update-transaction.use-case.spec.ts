import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { UpdateTransactionUseCase } from './update-transaction.use-case';
import { TransactionStateService } from '../services/transaction-state.service';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { Transaction } from '../../domain/models/transaction.model';
import { UpdateTransactionDto } from '../../domain/ports/transaction.port';

const mockTx: Transaction = {
  id: 'tx1', description: 'Salario actualizado', amount: 3500, category: 'salary', type: 'income', date: new Date(),
};

const dto: UpdateTransactionDto = {
  description: 'Salario actualizado', amount: 3500, category: 'salary', type: 'income', transactionDate: '2026-05-01',
};

describe('UpdateTransactionUseCase', () => {
  let useCase: UpdateTransactionUseCase;
  let port: any;
  let state: TransactionStateService;

  beforeEach(() => {
    const portSpy = {
      getAll: vi.fn(), getAllNoPagination: vi.fn(), getSummary: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        UpdateTransactionUseCase,
        { provide: TRANSACTION_PORT, useValue: portSpy },
        TransactionStateService,
      ],
    });

    useCase = TestBed.inject(UpdateTransactionUseCase);
    port = TestBed.inject(TRANSACTION_PORT);
    state = TestBed.inject(TransactionStateService);
  });

  it('should call port.update with id and DTO', () => {
    port.update.mockReturnValue(of(mockTx));

    useCase.execute('tx1', dto);

    expect(port.update).toHaveBeenCalledWith('tx1', dto);
  });

  it('should replace the transaction in state', () => {
    // Pre-populate state
    state.setPaginatedTransactions({
      content: [{ ...mockTx, description: 'Old' }], totalElements: 1, totalPages: 1, page: 1, size: 15,
    });
    port.update.mockReturnValue(of(mockTx));

    useCase.execute('tx1', dto);

    expect(state.transactions()[0].description).toBe('Salario actualizado');
  });

  it('should invoke onSuccess callback', () => {
    port.update.mockReturnValue(of(mockTx));
    const onSuccess = vi.fn();

    useCase.execute('tx1', dto, onSuccess);

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should set error on failure', () => {
    port.update.mockReturnValue(throwError(() => new Error('Update failed')));

    useCase.execute('tx1', dto);

    expect(state.error()).toBe('Update failed');
  });
});
