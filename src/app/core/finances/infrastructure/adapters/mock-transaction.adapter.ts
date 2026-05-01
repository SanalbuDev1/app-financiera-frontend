import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Transaction } from '../../domain/models/transaction.model';
import { FinancialSummary } from '../../domain/models/summary.model';
import {
  TransactionPort,
  TransactionFilter,
  PaginatedResponse,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '../../domain/ports/transaction.port';

/** Datos mock para desarrollo sin backend */
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1',  userId: '2', description: 'Salario',              amount: 4500, category: 'salary',        type: 'income',  date: new Date('2026-04-01') },
  { id: '2',  userId: '2', description: 'Arriendo',             amount: 1200, category: 'bills',         type: 'expense', date: new Date('2026-04-02') },
  { id: '3',  userId: '2', description: 'Mercado semanal',      amount: 320,  category: 'food',          type: 'expense', date: new Date('2026-04-03') },
  { id: '4',  userId: '2', description: 'Uber',                 amount: 45,   category: 'transport',     type: 'expense', date: new Date('2026-04-03') },
  { id: '5',  userId: '2', description: 'Netflix',              amount: 45,   category: 'entertainment', type: 'expense', date: new Date('2026-04-04') },
  { id: '6',  userId: '2', description: 'Freelance diseño',     amount: 800,  category: 'freelance',     type: 'income',  date: new Date('2026-04-05') },
  { id: '7',  userId: '2', description: 'Gasolina',             amount: 120,  category: 'transport',     type: 'expense', date: new Date('2026-04-05') },
  { id: '8',  userId: '2', description: 'Almuerzo trabajo',     amount: 35,   category: 'food',          type: 'expense', date: new Date('2026-04-06') },
  { id: '9',  userId: '2', description: 'Spotify',              amount: 15,   category: 'entertainment', type: 'expense', date: new Date('2026-04-06') },
  { id: '10', userId: '2', description: 'Supermercado',         amount: 280,  category: 'food',          type: 'expense', date: new Date('2026-04-07') },
  { id: '11', userId: '2', description: 'Transferencia recibida', amount: 500, category: 'salary',      type: 'income',  date: new Date('2026-04-07') },
  { id: '12', userId: '2', description: 'Cena restaurante',     amount: 95,   category: 'food',          type: 'expense', date: new Date('2026-04-08') },
  { id: '13', userId: '2', description: 'Gym mensualidad',      amount: 60,   category: 'health',        type: 'expense', date: new Date('2026-04-08') },
  { id: '14', userId: '2', description: 'Parqueadero',          amount: 25,   category: 'transport',     type: 'expense', date: new Date('2026-04-09') },
  { id: '15', userId: '2', description: 'Farmacia',             amount: 42,   category: 'health',        type: 'expense', date: new Date('2026-04-09') },
  { id: '16', userId: '2', description: 'Dividendos',           amount: 350,  category: 'investment',    type: 'income',  date: new Date('2026-04-10') },
  { id: '17', userId: '2', description: 'Luz eléctrica',        amount: 85,   category: 'bills',         type: 'expense', date: new Date('2026-04-10') },
  { id: '18', userId: '2', description: 'Agua',                 amount: 35,   category: 'bills',         type: 'expense', date: new Date('2026-04-11') },
  { id: '19', userId: '2', description: 'Internet',             amount: 65,   category: 'bills',         type: 'expense', date: new Date('2026-04-11') },
  { id: '20', userId: '2', description: 'Café',                 amount: 12,   category: 'food',          type: 'expense', date: new Date('2026-04-12') },
  { id: '21', userId: '2', description: 'Ropa',                 amount: 180,  category: 'shopping',      type: 'expense', date: new Date('2026-04-12') },
  { id: '22', userId: '2', description: 'Comisión venta',       amount: 1200, category: 'freelance',     type: 'income',  date: new Date('2026-04-13') },
  { id: '23', userId: '2', description: 'Taxi',                 amount: 28,   category: 'transport',     type: 'expense', date: new Date('2026-04-13') },
  { id: '24', userId: '2', description: 'Cine',                 amount: 32,   category: 'entertainment', type: 'expense', date: new Date('2026-04-14') },
  { id: '25', userId: '2', description: 'Mercado frutas',       amount: 55,   category: 'food',          type: 'expense', date: new Date('2026-04-14') },
  { id: '26', userId: '2', description: 'Seguro salud',         amount: 200,  category: 'health',        type: 'expense', date: new Date('2026-04-15') },
  { id: '27', userId: '2', description: 'Peluquería',           amount: 40,   category: 'other',         type: 'expense', date: new Date('2026-04-15') },
  { id: '28', userId: '2', description: 'Ingreso extra',        amount: 600,  category: 'other',         type: 'income',  date: new Date('2026-04-16') },
  { id: '29', userId: '2', description: 'Almuerzo domicilio',   amount: 28,   category: 'food',          type: 'expense', date: new Date('2026-04-16') },
  { id: '30', userId: '2', description: 'Lavandería',           amount: 22,   category: 'other',         type: 'expense', date: new Date('2026-04-17') },
  { id: '31', userId: '2', description: 'Bus',                  amount: 8,    category: 'transport',     type: 'expense', date: new Date('2026-04-18') },
  { id: '32', userId: '2', description: 'Snacks oficina',       amount: 18,   category: 'food',          type: 'expense', date: new Date('2026-04-19') },
];

/**
 * Adaptador mock de transacciones para desarrollo local sin backend.
 * Simula CRUD en memoria con delay de 400ms.
 * Para activar el backend real, cambiar a JavaTransactionAdapter en app.config.ts.
 */
@Injectable()
export class MockTransactionAdapter implements TransactionPort {
  private transactions = [...MOCK_TRANSACTIONS];

  /**
   * Retorna transacciones paginadas con filtros opcionales.
   * Simula paginación server-side sobre datos en memoria.
   */
  getAll(filter: TransactionFilter): Observable<PaginatedResponse<Transaction>> {
    console.log('[MockTransactionAdapter] getAll()', filter);
    let list = [...this.transactions].sort((a, b) => b.date.getTime() - a.date.getTime());

    if (filter.from) list = list.filter(tx => tx.date >= new Date(filter.from!));
    if (filter.to) list = list.filter(tx => tx.date <= new Date(filter.to! + 'T23:59:59'));
    if (filter.type) list = list.filter(tx => tx.type === filter.type);

    const page = filter.page ?? 1;
    const size = filter.size ?? 15;
    const start = (page - 1) * size;

    const response: PaginatedResponse<Transaction> = {
      content: list.slice(start, start + size),
      totalElements: list.length,
      totalPages: Math.ceil(list.length / size) || 1,
      page,
      size,
    };
    console.log(`[MockTransactionAdapter] getAll() ← ${response.totalElements} registros, página ${page}/${response.totalPages}`);
    return of(response).pipe(delay(400));
  }

  /**
   * Retorna todas las transacciones sin paginación.
   */
  getAllNoPagination(): Observable<Transaction[]> {
    console.log('[MockTransactionAdapter] getAllNoPagination()');
    const list = [...this.transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
    return of(list).pipe(delay(400));
  }

  /**
   * Retorna un resumen financiero calculado desde los datos mock.
   */
  getSummary(month: number, year: number): Observable<FinancialSummary> {
    console.log('[MockTransactionAdapter] getSummary()', { month, year });
    const monthTx = this.transactions.filter(tx => {
      const d = tx.date;
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    return of({
      totalBalance: income - expenses + 5000,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      monthlySavings: income - expenses,
      savingsGoal: 3000,
    }).pipe(delay(400));
  }

  /**
   * Crea una nueva transacción y la agrega al inicio de la lista mock.
   */
  create(dto: CreateTransactionDto): Observable<Transaction> {
    console.log('[MockTransactionAdapter] create()', dto);
    const tx: Transaction = {
      id: crypto.randomUUID(),
      description: dto.description,
      amount: dto.amount,
      category: dto.category as Transaction['category'],
      type: dto.type,
      date: new Date(dto.transactionDate),
      notes: dto.notes,
      createdAt: new Date(),
    };
    this.transactions.unshift(tx);
    console.log('[MockTransactionAdapter] create() ← id:', tx.id);
    return of(tx).pipe(delay(400));
  }

  /**
   * Actualiza una transacción existente por ID en la lista mock.
   */
  update(id: string, dto: UpdateTransactionDto): Observable<Transaction> {
    console.log('[MockTransactionAdapter] update()', { id, dto });
    const idx = this.transactions.findIndex(tx => tx.id === id);
    if (idx === -1) {
      console.warn('[MockTransactionAdapter] update() ← no encontrada', id);
      return of(null as unknown as Transaction).pipe(delay(400));
    }
    const updated: Transaction = {
      ...this.transactions[idx],
      description: dto.description,
      amount: dto.amount,
      category: dto.category as Transaction['category'],
      type: dto.type,
      date: new Date(dto.transactionDate),
      notes: dto.notes,
    };
    this.transactions[idx] = updated;
    console.log('[MockTransactionAdapter] update() ← actualizada', id);
    return of(updated).pipe(delay(400));
  }

  /**
   * Elimina una transacción por ID de la lista mock.
   */
  delete(id: string): Observable<void> {
    console.log('[MockTransactionAdapter] delete()', id);
    this.transactions = this.transactions.filter(tx => tx.id !== id);
    return of(undefined as void).pipe(delay(400));
  }
}
