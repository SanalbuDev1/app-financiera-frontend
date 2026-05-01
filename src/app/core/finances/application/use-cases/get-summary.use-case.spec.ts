import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GetSummaryUseCase } from './get-summary.use-case';
import { TransactionStateService } from '../services/transaction-state.service';
import { TRANSACTION_PORT } from '../../infrastructure/tokens/transaction.token';
import { FinancialSummary } from '../../domain/models/summary.model';

const mockSummary: FinancialSummary = {
  totalBalance: 5000,
  monthlyIncome: 3000,
  monthlyExpenses: 1000,
  monthlySavings: 2000,
  savingsGoal: 3000,
};

describe('GetSummaryUseCase', () => {
  let useCase: GetSummaryUseCase;
  let port: any;
  let state: TransactionStateService;

  beforeEach(() => {
    const portSpy = {
      getAll: vi.fn(), getAllNoPagination: vi.fn(), getSummary: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GetSummaryUseCase,
        { provide: TRANSACTION_PORT, useValue: portSpy },
        TransactionStateService,
      ],
    });

    useCase = TestBed.inject(GetSummaryUseCase);
    port = TestBed.inject(TRANSACTION_PORT);
    state = TestBed.inject(TransactionStateService);
  });

  it('should call port.getSummary with month and year', () => {
    port.getSummary.mockReturnValue(of(mockSummary));

    useCase.execute(5, 2026);

    expect(port.getSummary).toHaveBeenCalledWith(5, 2026);
  });

  it('should update state summary on success', () => {
    port.getSummary.mockReturnValue(of(mockSummary));

    useCase.execute(5, 2026);

    expect(state.summary()).toEqual(mockSummary);
  });

  it('should set loading to false after completion', () => {
    port.getSummary.mockReturnValue(of(mockSummary));

    useCase.execute(5, 2026);

    expect(state.loading()).toBe(false);
  });

  it('should set error on failure', () => {
    port.getSummary.mockReturnValue(throwError(() => new Error('Summary error')));

    useCase.execute(5, 2026);

    expect(state.error()).toBe('Summary error');
    expect(state.loading()).toBe(false);
  });
});
