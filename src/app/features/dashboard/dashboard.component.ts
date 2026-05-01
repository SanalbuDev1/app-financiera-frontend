import { Component, OnInit, inject, signal, computed, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStateService } from '../../core/auth/application/services/auth-state.service';
import { TransactionStateService } from '../../core/finances/application/services/transaction-state.service';
import { ListTransactionsUseCase } from '../../core/finances/application/use-cases/list-transactions.use-case';
import { GetSummaryUseCase } from '../../core/finances/application/use-cases/get-summary.use-case';
import { CreateTransactionUseCase } from '../../core/finances/application/use-cases/create-transaction.use-case';
import { UpdateTransactionUseCase } from '../../core/finances/application/use-cases/update-transaction.use-case';
import { DeleteTransactionUseCase } from '../../core/finances/application/use-cases/delete-transaction.use-case';
import { Transaction, TransactionCategory, getCategoryIcon, CATEGORY_ICONS } from '../../core/finances/domain/models/transaction.model';
import { CreateTransactionDto } from '../../core/finances/domain/ports/transaction.port';
import { IncomeModalComponent } from './income-modal/income-modal.component';
import { ExpenseModalComponent } from './expense-modal/expense-modal.component';

/** Mapa de categoría → label legible en español */
const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food:          'Alimentación',
  transport:     'Transporte',
  entertainment: 'Entretenimiento',
  health:        'Salud',
  education:     'Educación',
  shopping:      'Compras',
  bills:         'Cuentas',
  salary:        'Salario',
  freelance:     'Freelance',
  investment:    'Inversión',
  savings:       'Ahorros',
  other:         'Otro',
};

/** Paleta de colores para los segmentos del donut chart */
const DONUT_COLORS = [
  'var(--color-red)',
  'var(--color-blue)',
  'var(--color-green)',
  'var(--color-yellow)',
  'var(--color-purple)',
  'var(--color-teal)',
  '#F97316',
  '#EC4899',
];

/**
 * Componente principal del dashboard financiero.
 * Muestra resumen, transacciones recientes, presupuestos y gráficos.
 * Utiliza datos mock hardcodeados — pendiente conectar con FinancePort.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, IncomeModalComponent, ExpenseModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly transactionState = inject(TransactionStateService);
  private readonly listTransactionsUseCase = inject(ListTransactionsUseCase);
  private readonly getSummaryUseCase = inject(GetSummaryUseCase);
  private readonly createTransactionUseCase = inject(CreateTransactionUseCase);
  private readonly updateTransactionUseCase = inject(UpdateTransactionUseCase);
  private readonly deleteTransactionUseCase = inject(DeleteTransactionUseCase);

  /** Resumen financiero del mes (desde el estado global) */
  readonly summary = this.transactionState.summary;

  /** Todas las transacciones del usuario (para gráficos y análisis) */
  private readonly allTransactions = this.transactionState.allTransactions;

  /** Nombres de meses en español abreviado */
  private readonly MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /** Nombres de meses completos en español para los botones */
  private readonly MONTH_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  /** Nombres de meses abreviados (3 letras) para mobile */
  private readonly MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  /** Mes seleccionado (0-based) — por defecto el mes actual */
  readonly selectedMonth = signal(new Date().getMonth());

  /** Año seleccionado — por defecto el año actual */
  readonly selectedYear = signal(new Date().getFullYear());

  /** Botones de los 12 meses del año */
  readonly monthButtons = computed(() => {
    return this.MONTH_FULL.map((label, index) => ({
      index,
      label,
      short: this.MONTH_SHORT[index],
    }));
  });

  /** Selecciona un mes y recarga los datos */
  selectMonth(monthIndex: number): void {
    console.log('[DashboardComponent] selectMonth()', this.MONTH_FULL[monthIndex]);
    this.selectedMonth.set(monthIndex);
    this.loadSummary();
  }

  /** Navega al mes anterior (stepper móvil) */
  prevMonth(): void {
    const current = this.selectedMonth();
    if (current > 0) this.selectMonth(current - 1);
  }

  /** Navega al mes siguiente (stepper móvil) */
  nextMonth(): void {
    const current = this.selectedMonth();
    if (current < 11) this.selectMonth(current + 1);
  }

  /** Gráfico mensual: ingresos vs gastos de los últimos 6 meses (computed desde datos reales) */
  readonly monthlyChart = computed(() => {
    const txs = this.allTransactions();
    const selMonth = this.selectedMonth();
    const selYear = this.selectedYear();
    const months: { month: string; income: number; expense: number; isSelected: boolean }[] = [];

    // Mostrar 6 meses centrados en el mes seleccionado (2 antes, seleccionado, 3 después)
    for (let i = -2; i <= 3; i++) {
      const d = new Date(selYear, selMonth + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthTxs = txs.filter(tx => {
        const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
        return txDate.getMonth() === m && txDate.getFullYear() === y;
      });
      months.push({
        month: this.MONTH_NAMES[m],
        income:  monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expense: monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        isSelected: m === selMonth && y === selYear,
      });
    }
    return months;
  });

  /** Top categorías de gasto del mes seleccionado (computed desde datos reales) */
  readonly topCategories = computed(() => {
    const txs = this.allTransactions();
    const m = this.selectedMonth();
    const y = this.selectedYear();

    const monthExpenses = txs.filter(tx => {
      const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
      return tx.type === 'expense' && txDate.getMonth() === m && txDate.getFullYear() === y;
    });

    const byCategory = new Map<TransactionCategory, number>();
    for (const tx of monthExpenses) {
      byCategory.set(tx.category, (byCategory.get(tx.category) ?? 0) + tx.amount);
    }

    return [...byCategory.entries()]
      .map(([category, total]) => ({
        category,
        label: CATEGORY_LABELS[category] ?? category,
        icon: getCategoryIcon(category),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });

  /** Total gastado en el mes actual (para calcular porcentajes en top categorías) */
  readonly monthlyExpenseTotal = computed(() =>
    this.topCategories().reduce((s, c) => s + c.total, 0)
  );

  // ── Filtro de fechas y paginación de transacciones ──────────────────────
  readonly PAGE_SIZE = 15;
  readonly filterDateFrom = signal<string>('');
  readonly filterDateTo   = signal<string>('');
  readonly txPage         = signal(1);

  /** Total de registros (desde el servidor) */
  readonly totalRecords = this.transactionState.totalElements;

  /** Total de páginas (paginación server-side) */
  readonly txTotalPages = this.transactionState.totalPages;

  /** Transacciones de la página actual (paginadas por el servidor) */
  readonly paginatedTransactions = this.transactionState.transactions;

  /** Indica si se están cargando datos */
  readonly loading = this.transactionState.loading;

  /** Navegar a una página */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.txTotalPages()) {
      this.txPage.set(page);
      this.loadTransactions();
    }
  }

  /** Limpiar filtro de fechas */
  clearDateFilter(): void {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.txPage.set(1);
    this.loadTransactions();
  }

  /** Al cambiar filtro, resetear a página 1 */
  onFilterChange(): void {
    this.txPage.set(1);
    this.loadTransactions();
  }

  /** Retorna el emoji correspondiente a una categoría (sin guardarlo en BD) */
  getCategoryIcon = getCategoryIcon;

  /** Nombre del usuario autenticado */
  readonly userName = this.authState.currentUser;

  /** Controla si el modal de nuevo ingreso está abierto */
  readonly isIncomeModalOpen = signal(false);

  /** Controla si el modal de nuevo gasto está abierto */
  readonly isExpenseModalOpen = signal(false);

  /** Transacción que se está editando (null = modo creación) */
  readonly editingTransaction = signal<Transaction | null>(null);

  /** Controla el tema oscuro/claro */
  readonly isDarkTheme = signal(false);

  /** Controla si el sidebar está abierto en móvil */
  readonly isSidebarOpen = signal(false);

  /** Items de navegación lateral */
  readonly navItems: { icon: string; label: string; active: boolean; action: () => void }[] = [
    { icon: '🏠', label: 'Inicio',       active: true,  action: () => {} },
    { icon: '💰', label: 'Ingresos',     active: false, action: () => { this.isIncomeModalOpen.set(true);  this.closeSidebar(); } },
    { icon: '💸', label: 'Gastos',       active: false, action: () => { this.isExpenseModalOpen.set(true); this.closeSidebar(); } },
    { icon: '📊', label: 'Presupuestos', active: false, action: () => {} },
    { icon: '📈', label: 'Reportes',     active: false, action: () => {} },
  ];
  /** Valor máximo del gráfico de barras para escalar las alturas */
  get chartMax(): number {
    const max = Math.max(...this.monthlyChart().flatMap(m => [m.income, m.expense]));
    return max > 0 ? max : 1;
  }

  /**
   * Calcula el porcentaje de una categoría respecto al total de gastos del mes.
   */
  getCategoryPercent(total: number): number {
    const expenseTotal = this.monthlyExpenseTotal();
    return expenseTotal > 0 ? Math.round((total / expenseTotal) * 100) : 0;
  }

  /**
   * Segmentos SVG para el donut chart de gastos del mes.
   * Cada segmento tiene: path (arco SVG), color, label, icon, total, percent.
   */
  readonly donutSegments = computed(() => {
    const cats = this.topCategories();
    const total = this.monthlyExpenseTotal();
    if (total === 0) return [];

    const r = 40;
    const cx = 50;
    const cy = 50;
    let currentAngle = -Math.PI / 2;

    return cats.map((cat, i) => {
      const pct = cat.total / total;
      const startAngle = currentAngle;
      const endAngle = startAngle + pct * 2 * Math.PI;
      currentAngle = endAngle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = pct > 0.5 ? 1 : 0;
      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

      return {
        path,
        color: DONUT_COLORS[i % DONUT_COLORS.length],
        label: cat.label,
        icon: cat.icon,
        total: cat.total,
        percent: Math.round(pct * 100),
      };
    });
  });

  /**
   * Abre el sidebar en móvil.
   */
  toggleSidebar(): void {
    console.log('[DashboardComponent] toggleSidebar()');
    this.isSidebarOpen.update(v => !v);
  }

  /**
   * Cierra el sidebar (al hacer click en el overlay o en un item).
   */
  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  ngOnInit(): void {
    console.log('[DashboardComponent] ngOnInit()', { user: this.authState.currentUser()?.name });
    this.loadTransactions();
    this.loadSummary();
    this.listTransactionsUseCase.loadAll();
  }

  /** Carga transacciones desde el backend con los filtros actuales. */
  private loadTransactions(): void {
    this.listTransactionsUseCase.execute({
      from: this.filterDateFrom() || undefined,
      to: this.filterDateTo() || undefined,
      page: this.txPage(),
      size: this.PAGE_SIZE,
    });
  }

  /** Carga el resumen financiero del mes seleccionado. */
  private loadSummary(): void {
    this.getSummaryUseCase.execute(this.selectedMonth() + 1, this.selectedYear());
  }

  /** Recarga transacciones, resumen y datos para gráficos. */
  private reloadAll(): void {
    this.loadTransactions();
    this.loadSummary();
    this.listTransactionsUseCase.loadAll();
  }

  /**
   * Cierra la sesión del usuario y navega a /login.
   * Stub — pendiente conectar con LogoutUseCase.
   */
  onLogout(): void {
    console.log('[DashboardComponent] onLogout()');
    this.authState.clearCurrentUser();
    this.router.navigate(['/login']);
  }

  /**
   * Recibe el DTO del gasto desde el modal y lo crea o actualiza vía use case.
   */
  onExpenseSaved(dto: CreateTransactionDto): void {
    console.log('[DashboardComponent] onExpenseSaved()', dto);
    const editing = this.editingTransaction();
    if (editing) {
      this.updateTransactionUseCase.execute(editing.id, dto, () => {
        this.isExpenseModalOpen.set(false);
        this.editingTransaction.set(null);
        this.reloadAll();
      });
    } else {
      this.createTransactionUseCase.execute(dto, () => {
        this.isExpenseModalOpen.set(false);
        this.reloadAll();
      });
    }
  }

  /**
   * Cierra el modal de gastos sin guardar.
   */
  onExpenseModalClosed(): void {
    console.log('[DashboardComponent] onExpenseModalClosed()');
    this.isExpenseModalOpen.set(false);
    this.editingTransaction.set(null);
  }

  /** Alterna entre tema claro y oscuro */
  toggleTheme(): void {
    console.log('[DashboardComponent] toggleTheme()');
    this.isDarkTheme.update(v => !v);
  }

  /** Abre el modal para añadir un nuevo ingreso.
   */
  onAddTransaction(): void {
    console.log('[DashboardComponent] onAddTransaction() — abriendo modal de ingresos');
    this.editingTransaction.set(null);
    this.isIncomeModalOpen.set(true);
  }

  /**
   * Recibe el DTO del ingreso desde el modal y lo crea o actualiza vía use case.
   */
  onIncomeSaved(dto: CreateTransactionDto): void {
    console.log('[DashboardComponent] onIncomeSaved()', dto);
    const editing = this.editingTransaction();
    if (editing) {
      this.updateTransactionUseCase.execute(editing.id, dto, () => {
        this.isIncomeModalOpen.set(false);
        this.editingTransaction.set(null);
        this.reloadAll();
      });
    } else {
      this.createTransactionUseCase.execute(dto, () => {
        this.isIncomeModalOpen.set(false);
        this.reloadAll();
      });
    }
  }

  /**
   * Cierra el modal de ingresos sin guardar.
   */
  onIncomeModalClosed(): void {
    console.log('[DashboardComponent] onIncomeModalClosed()');
    this.isIncomeModalOpen.set(false);
    this.editingTransaction.set(null);
  }

  /**
   * Abre el modal correspondiente en modo edición para la transacción indicada.
   */
  onEditTransaction(tx: Transaction): void {
    console.log('[DashboardComponent] onEditTransaction()', tx.id);
    this.editingTransaction.set(tx);
    if (tx.type === 'income') {
      this.isIncomeModalOpen.set(true);
    } else {
      this.isExpenseModalOpen.set(true);
    }
  }

  /**
   * Elimina una transacción vía use case y recarga datos.
   */
  onDeleteTransaction(id: string): void {
    console.log('[DashboardComponent] onDeleteTransaction()', id);
    this.deleteTransactionUseCase.execute(id, () => {
      this.reloadAll();
    });
  }
}

