import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { JavaTransactionAdapter } from './java-transaction.adapter';
import { Transaction } from '../../domain/models/transaction.model';
import { PaginatedResponse } from '../../domain/ports/transaction.port';
import { FinancialSummary } from '../../domain/models/summary.model';

describe('JavaTransactionAdapter', () => {
  let adapter: JavaTransactionAdapter;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JavaTransactionAdapter,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    adapter = TestBed.inject(JavaTransactionAdapter);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  describe('getAll', () => {
    it('should make GET request with correct params', () => {
      adapter.getAll({ from: '2026-05-01', to: '2026-05-31', page: 1, size: 15 }).subscribe();

      const req = httpTesting.expectOne(r =>
        r.url === 'http://localhost:9000/api/transactions' &&
        r.params.get('from') === '2026-05-01' &&
        r.params.get('to') === '2026-05-31' &&
        r.params.get('page') === '0' && // 0-indexed for backend
        r.params.get('size') === '15'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 15 });
    });

    it('should parse dates correctly using parseLocalDate', () => {
      let result: PaginatedResponse<Transaction> | undefined;
      adapter.getAll({ page: 1, size: 15 }).subscribe(r => result = r);

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions?page=0&size=15');
      req.flush({
        content: [{ id: 'tx1', description: 'Test', amount: 100, category: 'food', type: 'expense', date: '2026-05-01' }],
        totalElements: 1, totalPages: 1, page: 0, size: 15,
      });

      expect(result!.content[0].date).toBeInstanceOf(Date);
      expect(result!.content[0].date.getMonth()).toBe(4); // May = 4 (0-indexed)
      expect(result!.content[0].date.getDate()).toBe(1);
    });

    it('should handle filter with type parameter', () => {
      adapter.getAll({ type: 'expense', page: 1, size: 15 }).subscribe();

      const req = httpTesting.expectOne(r =>
        r.params.get('type') === 'expense'
      );
      req.flush({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 15 });
    });
  });

  describe('getAllNoPagination', () => {
    it('should make GET request to /all', () => {
      adapter.getAllNoPagination().subscribe();

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions/all');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should parse dates in the list', () => {
      let result: Transaction[] | undefined;
      adapter.getAllNoPagination().subscribe(r => result = r);

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions/all');
      req.flush([
        { id: 'tx1', description: 'Test', amount: 50, category: 'bills', type: 'expense', date: '2026-04-30' },
      ]);

      expect(result![0].date).toBeInstanceOf(Date);
      expect(result![0].date.getMonth()).toBe(3); // April = 3
    });
  });

  describe('getSummary', () => {
    it('should make GET request with month and year params', () => {
      let result: FinancialSummary | undefined;
      adapter.getSummary(5, 2026).subscribe(r => result = r);

      const req = httpTesting.expectOne(r =>
        r.url === 'http://localhost:9000/api/transactions/summary' &&
        r.params.get('month') === '5' &&
        r.params.get('year') === '2026'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ totalBalance: 5000, monthlyIncome: 3000, monthlyExpenses: 1000, monthlySavings: 2000, savingsGoal: 3000 });

      expect(result!.totalBalance).toBe(5000);
    });
  });

  describe('create', () => {
    it('should make POST request with DTO body', () => {
      const dto = { description: 'Test', amount: 100, category: 'food', type: 'expense' as const, transactionDate: '2026-05-01' };
      adapter.create(dto).subscribe();

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ id: 'new-id', ...dto, date: '2026-05-01' });
    });

    it('should parse the returned date', () => {
      let result: Transaction | undefined;
      const dto = { description: 'Test', amount: 100, category: 'food', type: 'expense' as const, transactionDate: '2026-05-01' };
      adapter.create(dto).subscribe(r => result = r);

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions');
      req.flush({ id: 'new-id', description: 'Test', amount: 100, category: 'food', type: 'expense', date: '2026-05-15' });

      expect(result!.date).toBeInstanceOf(Date);
      expect(result!.date.getDate()).toBe(15);
    });
  });

  describe('update', () => {
    it('should make PUT request to /api/transactions/:id', () => {
      const dto = { description: 'Updated', amount: 200, category: 'bills', type: 'expense' as const, transactionDate: '2026-05-10' };
      adapter.update('tx1', dto).subscribe();

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions/tx1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ id: 'tx1', ...dto, date: '2026-05-10' });
    });
  });

  describe('delete', () => {
    it('should make DELETE request to /api/transactions/:id', () => {
      adapter.delete('tx1').subscribe();

      const req = httpTesting.expectOne('http://localhost:9000/api/transactions/tx1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('parseLocalDate (integration)', () => {
    it('should handle date-only strings without timezone offset', () => {
      let result: Transaction[] | undefined;
      adapter.getAllNoPagination().subscribe(r => result = r);

      httpTesting.expectOne('http://localhost:9000/api/transactions/all').flush([
        { id: 'tx1', description: 'May', amount: 100, category: 'food', type: 'expense', date: '2026-05-01' },
        { id: 'tx2', description: 'Jun', amount: 200, category: 'food', type: 'expense', date: '2026-06-15' },
      ]);

      // These should be in local time, month should be correct
      expect(result![0].date.getFullYear()).toBe(2026);
      expect(result![0].date.getMonth()).toBe(4); // May
      expect(result![0].date.getDate()).toBe(1);
      expect(result![1].date.getMonth()).toBe(5); // June
      expect(result![1].date.getDate()).toBe(15);
    });

    it('should handle ISO datetime strings', () => {
      let result: Transaction[] | undefined;
      adapter.getAllNoPagination().subscribe(r => result = r);

      httpTesting.expectOne('http://localhost:9000/api/transactions/all').flush([
        { id: 'tx1', description: 'Full ISO', amount: 100, category: 'food', type: 'expense', date: '2026-05-01T10:30:00' },
      ]);

      expect(result![0].date).toBeInstanceOf(Date);
    });
  });
});
