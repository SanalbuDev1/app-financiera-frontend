import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { TransactionStateService } from '../services/transaction-state.service';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { Transaction } from '../../domain/models/transaction.model';
import { CreateTransactionDto } from '../../domain/ports/transaction.port';

const mockTx: Transaction = {
  id: 'tx-new', description: 'Salario', amount: 3000, category: 'salary', type: 'income', date: new Date(),
};

const dto: CreateTransactionDto = {
  description: 'Salario', amount: 3000, category: 'salary', type: 'income', transactionDate: '2026-05-01',
};

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let port: any;
  let state: TransactionStateService;

  beforeEach(() => {
    const portSpy = {
      getAll: vi.fn(), getAllNoPagination: vi.fn(), getSummary: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CreateTransactionUseCase,
        { provide: TRANSACTION_PORT, useValue: portSpy },
        TransactionStateService,
      ],
    });

    useCase = TestBed.inject(CreateTransactionUseCase);
    port = TestBed.inject(TRANSACTION_PORT);
    state = TestBed.inject(TransactionStateService);
  });

  it('should call port.create with the DTO', () => {
    port.create.mockReturnValue(of(mockTx));

    useCase.execute(dto);

    expect(port.create).toHaveBeenCalledWith(dto);
  });

  it('should add the created transaction to state', () => {
    port.create.mockReturnValue(of(mockTx));

    useCase.execute(dto);

    expect(state.transactions()[0]).toEqual(mockTx);
  });

  it('should invoke onSuccess callback', () => {
    port.create.mockReturnValue(of(mockTx));
    const onSuccess = vi.fn();

    useCase.execute(dto, onSuccess);

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should set error on failure', () => {
    port.create.mockReturnValue(throwError(() => new Error('Create failed')));

    useCase.execute(dto);

    expect(state.error()).toBe('Create failed');
  });

  it('should NOT invoke onSuccess on failure', () => {
    port.create.mockReturnValue(throwError(() => new Error('fail')));
    const onSuccess = vi.fn();

    useCase.execute(dto, onSuccess);

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
