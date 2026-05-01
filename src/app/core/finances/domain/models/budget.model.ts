import { TransactionCategory } from './transaction.model';

/**
 * Representa el presupuesto asignado a una categoría y cuánto se ha consumido.
 */
export interface Budget {
  id: string;
  category: TransactionCategory;
  label: string;
  limit: number;
  current: number;
}
