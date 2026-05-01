import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { DashboardComponent } from './dashboard.component';
import { AuthStateService } from '../../core/auth/application/services/auth-state.service';
import { TransactionStateService } from '../../core/finances/application/services/transaction-state.service';
import { ListTransactionsUseCase } from '../../core/finances/application/use-cases/list-transactions.use-case';
import { GetSummaryUseCase } from '../../core/finances/application/use-cases/get-summary.use-case';
import { CreateTransactionUseCase } from '../../core/finances/application/use-cases/create-transaction.use-case';
import { UpdateTransactionUseCase } from '../../core/finances/application/use-cases/update-transaction.use-case';
import { DeleteTransactionUseCase } from '../../core/finances/application/use-cases/delete-transaction.use-case';
import { UserRole } from '../../core/auth/domain/models/user-role.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let authState: AuthStateService;
  let router: any;
  let listUseCase: any;
  let getSummaryUseCase: any;
  let createUseCase: any;
  let updateUseCase: any;
  let deleteUseCase: any;

  beforeEach(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: { getItem: () => null, setItem: () => {}, removeItem: () => {}, clear: () => {} },
      writable: true, configurable: true,
    });
    listUseCase = { execute: vi.fn(), loadAll: vi.fn() };
    getSummaryUseCase = { execute: vi.fn() };
    createUseCase = { execute: vi.fn() };
    updateUseCase = { execute: vi.fn() };
    deleteUseCase = { execute: vi.fn() };
    router = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: router },
        { provide: ListTransactionsUseCase, useValue: listUseCase },
        { provide: GetSummaryUseCase, useValue: getSummaryUseCase },
        { provide: CreateTransactionUseCase, useValue: createUseCase },
        { provide: UpdateTransactionUseCase, useValue: updateUseCase },
        { provide: DeleteTransactionUseCase, useValue: deleteUseCase },
      ],
    }).compileComponents();

    authState = TestBed.inject(AuthStateService);
    authState.setCurrentUser({
      id: 'u1', email: 'user@t.com', name: 'User', role: UserRole.USER, token: 'tok',
    });

    const fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => TestBed.resetTestingModule());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transactions and summary on init', () => {
    component.ngOnInit();
    expect(listUseCase.execute).toHaveBeenCalled();
    expect(getSummaryUseCase.execute).toHaveBeenCalled();
    expect(listUseCase.loadAll).toHaveBeenCalled();
  });

  it('should select current month by default', () => {
    const currentMonth = new Date().getMonth();
    expect(component.selectedMonth()).toBe(currentMonth);
  });

  it('should select current year by default', () => {
    const currentYear = new Date().getFullYear();
    expect(component.selectedYear()).toBe(currentYear);
  });

  describe('selectMonth', () => {
    it('should update selectedMonth and reload summary', () => {
      component.selectMonth(2); // March
      expect(component.selectedMonth()).toBe(2);
      expect(getSummaryUseCase.execute).toHaveBeenCalledWith(3, expect.any(Number)); // month+1
    });
  });

  describe('navigation', () => {
    it('prevMonth should decrement', () => {
      component.selectMonth(3);
      getSummaryUseCase.execute.mockClear();
      component.prevMonth();
      expect(component.selectedMonth()).toBe(2);
    });

    it('prevMonth should not go below 0', () => {
      component.selectMonth(0);
      component.prevMonth();
      expect(component.selectedMonth()).toBe(0);
    });

    it('nextMonth should increment', () => {
      component.selectMonth(3);
      getSummaryUseCase.execute.mockClear();
      component.nextMonth();
      expect(component.selectedMonth()).toBe(4);
    });

    it('nextMonth should not go above 11', () => {
      component.selectMonth(11);
      component.nextMonth();
      expect(component.selectedMonth()).toBe(11);
    });
  });

  describe('theme', () => {
    it('should start with light theme', () => {
      expect(component.isDarkTheme()).toBe(false);
    });
  });

  describe('sidebar', () => {
    it('should start closed', () => {
      expect(component.isSidebarOpen()).toBe(false);
    });

    it('should toggle sidebar', () => {
      component.toggleSidebar();
      expect(component.isSidebarOpen()).toBe(true);
      component.toggleSidebar();
      expect(component.isSidebarOpen()).toBe(false);
    });

    it('should close sidebar', () => {
      component.toggleSidebar();
      component.closeSidebar();
      expect(component.isSidebarOpen()).toBe(false);
    });
  });

  describe('modals', () => {
    it('should start with modals closed', () => {
      expect(component.isIncomeModalOpen()).toBe(false);
      expect(component.isExpenseModalOpen()).toBe(false);
    });

    it('should have no editing transaction initially', () => {
      expect(component.editingTransaction()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear user and navigate to /login', () => {
      component.onLogout();
      expect(authState.currentUser()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('pagination', () => {
    it('should go to page', () => {
      // Set up a state with multiple pages
      const txState = TestBed.inject(TransactionStateService);
      txState.setPaginatedTransactions({
        content: [], totalElements: 30, totalPages: 2, page: 1, size: 15,
      });

      component.goToPage(2);
      expect(component.txPage()).toBe(2);
      expect(listUseCase.execute).toHaveBeenCalled();
    });

    it('should not go to invalid page', () => {
      component.goToPage(0);
      expect(component.txPage()).toBe(1);
    });
  });

  describe('filters', () => {
    it('should reset page on filter change', () => {
      component.txPage.set(3);
      component.onFilterChange();
      expect(component.txPage()).toBe(1);
    });

    it('should clear date filters', () => {
      component.filterDateFrom.set('2026-01-01');
      component.filterDateTo.set('2026-12-31');
      component.clearDateFilter();
      expect(component.filterDateFrom()).toBe('');
      expect(component.filterDateTo()).toBe('');
    });
  });

  describe('monthlyChart computed', () => {
    it('should return 6 months of data', () => {
      const chart = component.monthlyChart();
      expect(chart).toHaveLength(6);
    });

    it('should have month labels', () => {
      const chart = component.monthlyChart();
      for (const entry of chart) {
        expect(entry.month).toBeTruthy();
        expect(typeof entry.income).toBe('number');
        expect(typeof entry.expense).toBe('number');
      }
    });
  });

  describe('monthButtons computed', () => {
    it('should return 12 month buttons', () => {
      expect(component.monthButtons()).toHaveLength(12);
    });
  });

  describe('getCategoryIcon', () => {
    it('should return emoji for known category', () => {
      expect(component.getCategoryIcon('food')).toBe('🍽️');
    });
  });
});
