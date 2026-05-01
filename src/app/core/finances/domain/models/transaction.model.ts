/** Tipo de transacción: ingreso o gasto */
export type TransactionType = 'income' | 'expense';

/** Categorías de gasto (deben coincidir con el backend Java) */
export const EXPENSE_CATEGORIES = ['food', 'transport', 'entertainment', 'health', 'education', 'shopping', 'bills', 'other'] as const;

/** Categorías de ingreso (deben coincidir con el backend Java) */
export const INCOME_CATEGORIES = ['salary', 'freelance', 'investment', 'savings', 'other'] as const;

/** Categorías disponibles para clasificar transacciones */
export type TransactionCategory =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'shopping'
  | 'bills'
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'savings'
  | 'other';

/**
 * Representa una transacción financiera (ingreso o gasto).
 * Alineado con la tabla `transactions` de PostgreSQL.
 */
export interface Transaction {
  id: string;
  userId?: string;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  date: Date;
  notes?: string;
  createdAt?: Date;
}

/** Mapa de categoría → emoji. Se usa en el frontend para renderizar el icono sin guardarlo en BD. */
export const CATEGORY_ICONS: Record<TransactionCategory, string> = {
  food:          '🍽️',
  transport:     '🚌',
  entertainment: '🎬',
  health:        '🏥',
  education:     '📚',
  shopping:      '🛍️',
  bills:         '🧾',
  salary:        '💰',
  freelance:     '💻',
  investment:    '📈',
  savings:       '🏦',
  other:         '📦',
};

/** Retorna el emoji correspondiente a una categoría */
export function getCategoryIcon(category: TransactionCategory): string {
  return CATEGORY_ICONS[category] ?? '📦';
}
